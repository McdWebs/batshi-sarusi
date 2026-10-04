import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type SignupProduct = { name: string; slug: string; image: string | null };

export type Signup = {
  id: string;
  productId: number;
  email: string;
  createdAt: string;
  product: SignupProduct;
};

export type DemandRow = {
  productId: number;
  name: string;
  slug: string;
  image: string | null;
  count: number;
  lastSignupAt: string;
};

type FileShape = { signups: Signup[] };

/**
 * Demo storage for "notify me when it is back" signups: one JSON file, no database.
 * Writes are queued so two signups at once cannot overwrite each other, and the file is replaced atomically.
 * A real launch needs a proper store and a mail provider; this only proves the flow and the demand ranking.
 */
export class BackInStockStore {
  private signups: Signup[] | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async load(): Promise<Signup[]> {
    if (this.signups) return this.signups;
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, "utf-8")) as Partial<FileShape>;
      this.signups = Array.isArray(parsed.signups) ? parsed.signups : [];
    } catch {
      this.signups = [];
    }
    return this.signups;
  }

  private async persist(signups: Signup[]) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify({ signups } satisfies FileShape, null, 2), "utf-8");
    await fs.rename(temp, this.filePath);
  }

  /** Adds a signup. The same email for the same product is stored once. */
  add(productId: number, email: string, product: SignupProduct): Promise<{ alreadySubscribed: boolean }> {
    const run = async () => {
      const signups = await this.load();
      const normalized = email.trim().toLowerCase();
      if (signups.some((entry) => entry.productId === productId && entry.email === normalized)) {
        return { alreadySubscribed: true };
      }
      const next = [...signups, { id: randomUUID(), productId, email: normalized, createdAt: new Date().toISOString(), product }];
      await this.persist(next);
      this.signups = next;
      return { alreadySubscribed: false };
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  /** Products ranked by how many people are waiting. Counts only, never the emails. */
  async ranking(): Promise<DemandRow[]> {
    const signups = await this.load();
    const byProduct = new Map<number, DemandRow>();
    for (const entry of signups) {
      const row = byProduct.get(entry.productId);
      if (row) {
        row.count += 1;
        if (entry.createdAt > row.lastSignupAt) row.lastSignupAt = entry.createdAt;
      } else {
        byProduct.set(entry.productId, {
          productId: entry.productId,
          name: entry.product.name,
          slug: entry.product.slug,
          image: entry.product.image,
          count: 1,
          lastSignupAt: entry.createdAt,
        });
      }
    }
    return [...byProduct.values()].sort((a, b) => b.count - a.count || b.lastSignupAt.localeCompare(a.lastSignupAt));
  }
}
