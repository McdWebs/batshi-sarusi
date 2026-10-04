/**
 * Fills the analytics store with DEMO traffic so the owner dashboard can be shown before real visitors exist.
 *
 *   npm run analytics:seed-demo -w server      add about 30 days of made-up sessions
 *   npm run analytics:clear-demo -w server     remove them again
 *
 * Every row is flagged demo = 1 and the dashboard shows a "demo data" banner while any exist. Products are real (read
 * from the live catalog); the visits, searches and clicks are invented.
 */
import { getProductsPage } from "../services/productService.js";
import { getStore } from "../services/analyticsService.js";
import type { StoredEvent } from "../services/analyticsStore.js";
import { stripHtml } from "../services/contentStudioService.js";

const DAY = 86_400_000;
const DAYS = 30;

function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = prng(20261004);
const chance = (p: number) => rand() < p;
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
function weighted<T>(items: ReadonlyArray<readonly [T, number]>): T {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [item, weight] of items) {
    roll -= weight;
    if (roll <= 0) return item;
  }
  return items[0]![0];
}

const SOURCES = [["instagram", 40], ["influencer:etty", 12], ["influencer:talia", 10], ["direct", 20], ["google", 8], ["whatsapp", 7], ["facebook", 3]] as const;
const SEARCHES = [
  ["כוס", 12], ["סיר", 10], ["מגש", 8], ["מצעים", 8], ["פמוטים", 6], ["קנקן", 6], ["צלחות", 6], ["שמיכה", 5], ["סכו״ם", 5], ["מפה", 4],
  ["טוסטר", 4], ["מייבש כביסה", 3], ["מגבות ים", 3],
] as const;
const ZERO_RESULT = new Set(["טוסטר", "מייבש כביסה", "מגבות ים"]);
const SORTS = [["popularity:desc", 46], ["price:asc", 34], ["price:desc", 8], ["date:desc", 12]] as const;
const CLICKS = [["menu:sale", 30], ["menu:shop", 24], ["hero:cta", 16], ["category:card", 14], ["look:pin", 8], ["contact:whatsapp", 6], ["footer:contact", 2]] as const;

async function main() {
  const store = getStore();
  if (process.argv.includes("--clear")) {
    console.log(`Removed ${store.deleteDemoData()} demo events.`);
    return;
  }

  const [inStock, soldOut] = await Promise.all([
    getProductsPage({ perPage: 40, stockStatus: "instock", orderby: "popularity", order: "desc" }),
    getProductsPage({ perPage: 12, stockStatus: "outofstock", orderby: "popularity", order: "desc" }),
  ]);
  const live = inStock.items.map((product) => ({ id: product.id, name: stripHtml(product.name).slice(0, 80), inStock: true }));
  const out = soldOut.items.map((product) => ({ id: product.id, name: stripHtml(product.name).slice(0, 80), inStock: false }));
  if (live.length === 0) throw new Error("No live products to build demo data from");

  const events: StoredEvent[] = [];
  const now = Date.now();
  let sessionNumber = 0;

  for (let day = DAYS; day >= 0; day -= 1) {
    const date = new Date(now - day * DAY);
    const weekend = [5, 6].includes(date.getUTCDay());
    const growth = 1 + (DAYS - day) / DAYS * 0.5;
    const sessionsToday = Math.round((weekend ? 38 : 26) * growth * (0.8 + rand() * 0.4));

    for (let n = 0; n < sessionsToday; n += 1) {
      sessionNumber += 1;
      const visitorId = `demo-visitor-${Math.floor(sessionNumber * 0.82)}`;
      const sessionId = `demo-session-${sessionNumber}`;
      const device = weighted([["mobile", 72], ["desktop", 22], ["tablet", 6]] as const);
      let ts = now - day * DAY - Math.floor(rand() * 16 * 3_600_000);
      const base = { visitorId, sessionId, device, demo: true } as const;
      const add = (name: string, path: string, props: StoredEvent["props"] = {}, gapMs = 4_000 + Math.floor(rand() * 20_000)) => {
        ts += gapMs;
        events.push({ ...base, ts, name, path, props });
      };

      add("session_start", "/", { source: weighted(SOURCES) }, 0);
      add("page_view", chance(0.4) ? "/" : "/shop", {}, 300);
      if (chance(0.42)) continue; // leaves after one page

      if (chance(0.3)) {
        const q = weighted(SEARCHES);
        add("search", "/search", { query: q, results: ZERO_RESULT.has(q) ? 0 : 3 + Math.floor(rand() * 40) });
        add("page_view", "/search", {}, 300);
      }
      if (chance(0.38)) {
        const [orderby, order] = weighted(SORTS).split(":");
        add("sort_change", "/shop", { orderby: orderby ?? "date", order: order ?? "desc" });
      }
      if (chance(0.12)) add("page_change", "/shop", { page: 2 + Math.floor(rand() * 3) });
      if (chance(0.5)) add("click", "/", { id: weighted(CLICKS) });

      if (chance(0.62)) {
        const looksAtSoldOut = out.length > 0 && chance(0.14);
        const product = looksAtSoldOut ? pick(out) : pick(live);
        add("page_view", "/product/demo", {}, 600);
        add("product_view", "/product/demo", { productId: product.id, name: product.name, inStock: product.inStock });
        if (looksAtSoldOut && chance(0.22)) add("back_in_stock_signup", "/product/demo", { productId: product.id });
        if (!looksAtSoldOut && chance(0.26)) {
          add("add_to_cart", "/product/demo", { productId: product.id, name: product.name, qty: 1, from: "product_page" });
          if (chance(0.62)) {
            add("page_view", "/cart", {}, 600);
            add("cart_view", "/cart");
            if (chance(0.55)) {
              add("page_view", "/checkout", {}, 600);
              add("checkout_view", "/checkout");
            }
          }
        }
      }
    }
  }

  store.insertMany(events);
  console.log(`Added ${events.length} demo events across ${sessionNumber} sessions. Run with --clear (or npm run analytics:clear-demo) to remove them.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
