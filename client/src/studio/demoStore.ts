import type { StudioContent } from "../api/types";

/**
 * Demo-only "applied" state. Nothing here reaches WooCommerce: applied drafts live in this browser's
 * localStorage so the studio can show how a product page would look, until a real store is connected.
 */
const KEY = "batshi.studioDemo";

export type DemoEntry = { content: StudioContent; appliedAt: number };

function isContent(value: unknown): value is StudioContent {
  const entry = value as Partial<StudioContent> | null;
  return Boolean(
    entry &&
      typeof entry.description === "string" &&
      Array.isArray(entry.bullets) &&
      entry.bullets.every((bullet) => typeof bullet === "string") &&
      typeof entry.seoTitle === "string" &&
      typeof entry.metaDescription === "string" &&
      typeof entry.imageAlt === "string",
  );
}

function read(): Record<string, DemoEntry> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Partial<DemoEntry>>;
    const clean: Record<string, DemoEntry> = {};
    for (const [id, entry] of Object.entries(raw)) {
      if (entry && isContent(entry.content) && typeof entry.appliedAt === "number") {
        clean[id] = { content: entry.content, appliedAt: entry.appliedAt };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

function write(entries: Record<string, DemoEntry>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable (private window); the demo simply will not persist.
  }
}

export function getDemoEntry(productId: number): DemoEntry | undefined {
  return read()[String(productId)];
}

export function listDemoIds(): number[] {
  return Object.keys(read()).map(Number);
}

export function setDemoEntry(productId: number, content: StudioContent) {
  write({ ...read(), [String(productId)]: { content, appliedAt: Date.now() } });
}

export function removeDemoEntry(productId: number) {
  const entries = read();
  delete entries[String(productId)];
  write(entries);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain AI text to safe product-page HTML: paragraphs first, then the spec bullets as a list. */
export function demoContentHtml(content: Pick<StudioContent, "description" | "bullets">): string {
  const paragraphs = content.description
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`);
  const list = content.bullets.length ? `<ul>${content.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>` : "";
  return [...paragraphs, list].filter(Boolean).join("");
}
