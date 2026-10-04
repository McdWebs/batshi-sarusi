import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BackInStockStore } from "./backInStockStore.js";

const product = (name: string) => ({ name, slug: name, image: null });

describe("BackInStockStore", () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "batshi-bis-"));
    file = path.join(dir, "nested", "signups.json");
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("stores a signup once per product and email, ignoring case", async () => {
    const store = new BackInStockStore(file);
    expect(await store.add(1, "Dana@Example.com", product("a"))).toEqual({ alreadySubscribed: false });
    expect(await store.add(1, " dana@example.com ", product("a"))).toEqual({ alreadySubscribed: true });
    expect(await store.add(2, "dana@example.com", product("b"))).toEqual({ alreadySubscribed: false });
    expect((await store.ranking()).reduce((sum, row) => sum + row.count, 0)).toBe(2);
  });

  it("ranks products by how many people wait, and never returns emails", async () => {
    const store = new BackInStockStore(file);
    await store.add(1, "a@x.com", product("one"));
    await store.add(2, "a@x.com", product("two"));
    await store.add(2, "b@x.com", product("two"));
    await store.add(2, "c@x.com", product("two"));
    await store.add(3, "a@x.com", product("three"));
    await store.add(3, "b@x.com", product("three"));
    const ranking = await store.ranking();
    expect(ranking.map((row) => [row.productId, row.count])).toEqual([
      [2, 3],
      [3, 2],
      [1, 1],
    ]);
    expect(JSON.stringify(ranking)).not.toContain("@");
  });

  it("keeps every signup when many arrive at once, and survives a restart", async () => {
    const store = new BackInStockStore(file);
    await Promise.all(Array.from({ length: 25 }, (_, index) => store.add(7, `p${index}@x.com`, product("seven"))));
    expect((await store.ranking())[0]?.count).toBe(25);
    const reopened = new BackInStockStore(file);
    expect((await reopened.ranking())[0]?.count).toBe(25);
  });
});
