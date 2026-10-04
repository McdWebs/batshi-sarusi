import { beforeEach, describe, expect, it } from "vitest";
import { AnalyticsStore, type StoredEvent } from "./analyticsStore.js";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);

let sequence = 0;
function ev(session: string, visitor: string, offsetMs: number, name: string, props: StoredEvent["props"] = {}, extra: Partial<StoredEvent> = {}): StoredEvent {
  sequence += 1;
  return { ts: NOW - offsetMs + sequence, visitorId: visitor, sessionId: session, device: "mobile", name, path: "/x", props, ...extra };
}

describe("AnalyticsStore.summary", () => {
  let store: AnalyticsStore;

  beforeEach(() => {
    store = new AnalyticsStore(":memory:");
    store.insertMany([
      // s1: instagram visitor who browses, adds to cart, opens the cart
      ev("s1", "v1", 2 * 3_600_000, "session_start", { source: "instagram" }),
      ev("s1", "v1", 2 * 3_600_000 - 1_000, "page_view", {}, { path: "/shop" }),
      ev("s1", "v1", 2 * 3_600_000 - 60_000, "product_view", { productId: 7, name: "Pan", inStock: true }),
      ev("s1", "v1", 2 * 3_600_000 - 90_000, "add_to_cart", { productId: 7, qty: 1 }),
      ev("s1", "v1", 2 * 3_600_000 - 120_000, "cart_view"),
      ev("s1", "v1", 2 * 3_600_000 - 130_000, "page_view", {}, { path: "/cart" }),
      // s2: bounces on desktop from an influencer link, searches and finds nothing
      ev("s2", "v2", 3 * 3_600_000, "session_start", { source: "influencer:etty" }, { device: "desktop" }),
      ev("s2", "v2", 3 * 3_600_000 - 500, "page_view", {}, { device: "desktop", path: "/shop" }),
      ev("s2", "v2", 3 * 3_600_000 - 900, "search", { query: "tray", results: 0 }, { device: "desktop" }),
      // s3: views a sold-out product and asks to be told, changes the sort
      ev("s3", "v3", 5 * 3_600_000, "session_start", { source: "direct" }),
      ev("s3", "v3", 5 * 3_600_000 - 100, "page_view", {}, { path: "/shop" }),
      ev("s3", "v3", 5 * 3_600_000 - 200, "sort_change", { orderby: "price", order: "asc" }),
      ev("s3", "v3", 5 * 3_600_000 - 300, "product_view", { productId: 9, name: "Kettle", inStock: false }),
      ev("s3", "v3", 5 * 3_600_000 - 400, "back_in_stock_signup", { productId: 9 }),
      ev("s3", "v3", 5 * 3_600_000 - 450, "search", { query: "kettle", results: 4 }),
      ev("s3", "v3", 5 * 3_600_000 - 460, "search", { query: "kettle", results: 4 }),
      ev("s3", "v3", 5 * 3_600_000 - 470, "click", { id: "menu:sale" }),
      ev("s3", "v3", 5 * 3_600_000 - 480, "page_change", { page: 3 }),
      // earlier period: one session 8 days ago (previous period for a 7 day range)
      ev("old", "v9", 8 * DAY, "session_start", { source: "direct" }),
      ev("old", "v9", 8 * DAY - 100, "page_view"),
    ]);
  });

  it("counts visitors, sessions, page views and bounce for the range and the period before it", () => {
    const summary = store.summary(7, NOW, 3 * 3600);
    expect(summary.kpis).toMatchObject({ visitors: 3, sessions: 3, pageViews: 4 });
    expect(summary.kpis.pagesPerSession).toBe(1.3);
    expect(summary.kpis.bounceRate).toBe(0.667);
    expect(summary.previous).toMatchObject({ visitors: 1, sessions: 1, pageViews: 1 });
  });

  it("builds the funnel, sources and devices", () => {
    const summary = store.summary(7, NOW, 3 * 3600);
    expect(summary.funnel).toEqual([
      { step: "visit", sessions: 3 },
      { step: "product_view", sessions: 2 },
      { step: "add_to_cart", sessions: 1 },
      { step: "cart_view", sessions: 1 },
      { step: "checkout_view", sessions: 0 },
    ]);
    expect(Object.fromEntries(summary.sources.map((row) => [row.source, row.sessions]))).toEqual({
      instagram: 1,
      "influencer:etty": 1,
      direct: 1,
    });
    expect(Object.fromEntries(summary.devices.map((row) => [row.device, row.sessions]))).toEqual({ mobile: 2, desktop: 1 });
  });

  it("ranks products and finds viewed-but-never-added and sold-out demand", () => {
    const summary = store.summary(7, NOW, 3 * 3600);
    expect(summary.topProducts[0]).toMatchObject({ productId: 7, name: "Pan", views: 1, adds: 1 });
    expect(summary.viewedNeverAdded).toEqual([{ productId: 9, name: "Kettle", views: 1 }]);
    expect(summary.soldOut).toEqual([{ productId: 9, name: "Kettle", views: 1, signups: 1 }]);
  });

  it("reports searches, zero-result searches, sorting, paging and clicks", () => {
    const summary = store.summary(7, NOW, 3 * 3600);
    expect(summary.searches.total).toBe(3);
    expect(summary.searches.zeroResultRate).toBe(0.333);
    expect(summary.searches.top[0]).toEqual({ query: "kettle", count: 2, avgResults: 4 });
    expect(summary.searches.zeroResults).toEqual([{ query: "tray", count: 1 }]);
    expect(summary.sorting).toEqual([{ option: "price:asc", count: 1 }]);
    expect(summary.pagination).toEqual({ changes: 1, deepestPage: 3 });
    expect(summary.clicks).toEqual([{ id: "menu:sale", count: 1 }]);
    expect(summary.topPages[0]).toEqual({ path: "/shop", views: 3 });
  });

  it("returns one row per day, including quiet days", () => {
    const summary = store.summary(7, NOW, 3 * 3600);
    expect(summary.daily.length).toBeGreaterThanOrEqual(7);
    expect(summary.daily.at(-1)).toMatchObject({ day: "2026-10-10", visitors: 3, sessions: 3 });
    expect(summary.daily.some((row) => row.visitors === 0)).toBe(true);
  });

  it("handles an empty range without dividing by zero", () => {
    const empty = new AnalyticsStore(":memory:").summary(7, NOW, 0);
    expect(empty.kpis).toEqual({ visitors: 0, sessions: 0, pageViews: 0, pagesPerSession: 0, bounceRate: 0, avgSessionSeconds: 0 });
    expect(empty.searches).toMatchObject({ total: 0, zeroResultRate: 0 });
    expect(empty.funnel.every((step) => step.sessions === 0)).toBe(true);
  });

  it("flags demo data, and can remove it", () => {
    store.insertMany([ev("demo1", "dv1", 1_000, "page_view", {}, { demo: true })]);
    expect(store.summary(7, NOW, 0).hasDemoData).toBe(true);
    expect(store.deleteDemoData()).toBe(1);
    expect(store.summary(7, NOW, 0).hasDemoData).toBe(false);
  });

  it("forgets one visitor and purges old events", () => {
    const before = store.count();
    expect(store.forgetVisitor("v1")).toBeGreaterThan(0);
    expect(store.summary(7, NOW, 0).kpis.visitors).toBe(2);
    expect(store.purgeOlderThan(NOW - 7 * DAY)).toBe(2);
    expect(store.count()).toBeLessThan(before);
  });
});
