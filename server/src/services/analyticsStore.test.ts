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

describe("AnalyticsStore.summary: cart, problems, speed and engagement", () => {
  let store: AnalyticsStore;

  beforeEach(() => {
    store = new AnalyticsStore(":memory:");
    store.insertMany([
      // c1 adds to cart and gets as far as the address fields, never reaches checkout view completion... but opens it
      ev("c1", "u1", 1_000_000, "session_start", { source: "instagram", returning: false }),
      ev("c1", "u1", 990_000, "add_to_cart", { productId: 1, qty: 1 }),
      ev("c1", "u1", 980_000, "cart_view"),
      ev("c1", "u1", 970_000, "coupon_try", { ok: false }),
      ev("c1", "u1", 960_000, "coupon_try", { ok: true }),
      ev("c1", "u1", 950_000, "shipping_select", { method: "local_pickup" }),
      ev("c1", "u1", 940_000, "checkout_view"),
      ev("c1", "u1", 930_000, "checkout_field", { field: "email" }),
      ev("c1", "u1", 920_000, "checkout_field", { field: "city" }),
      // c2 adds to cart and leaves without opening checkout
      ev("c2", "u2", 800_000, "session_start", { source: "direct", returning: true }),
      ev("c2", "u2", 790_000, "add_to_cart", { productId: 2, qty: 1 }),
      ev("c2", "u2", 780_000, "checkout_field", { field: "email" }),
      ev("c2", "u2", 770_000, "shipping_select", { method: "pisol_extended_flat_shipping" }),
      // c3 browses only
      ev("c3", "u3", 700_000, "session_start", { source: "google", returning: false }),
      ev("c3", "u3", 690_000, "page_view", {}, { path: "/shop" }),
      ev("c3", "u3", 680_000, "error", { kind: "api", where: "GET /api/products", status: 503 }),
      ev("c3", "u3", 670_000, "error", { kind: "api", where: "GET /api/products", status: 503 }),
      ev("c3", "u3", 660_000, "error", { kind: "image", where: "/wp-content/uploads/a.jpg" }),
      ev("c3", "u3", 650_000, "not_found", {}, { path: "/old-page" }),
      ev("c3", "u3", 640_000, "rage_click", { target: "hero:cta" }),
      ev("c3", "u3", 630_000, "rage_click", { target: "hero:cta" }),
      ev("c3", "u3", 620_000, "scroll_depth", { pct: 25 }),
      ev("c3", "u3", 610_000, "scroll_depth", { pct: 50 }),
      ev("c2", "u2", 600_000, "scroll_depth", { pct: 25 }),
      // speed: three loads of /shop (2 mobile, 1 desktop) and one slow home load
      ev("c3", "u3", 590_000, "perf", { metric: "lcp", value: 1200 }, { path: "/shop" }),
      ev("c2", "u2", 580_000, "perf", { metric: "lcp", value: 3000 }, { path: "/shop" }),
      ev("c1", "u1", 570_000, "perf", { metric: "lcp", value: 2000 }, { path: "/shop", device: "desktop" }),
      ev("c1", "u1", 560_000, "perf", { metric: "lcp", value: 4000 }, { path: "/" }),
      // time on page
      ev("c1", "u1", 550_000, "page_time", { seconds: 10 }, { path: "/shop" }),
      ev("c2", "u2", 540_000, "page_time", { seconds: 20 }, { path: "/shop" }),
      ev("c3", "u3", 530_000, "page_time", { seconds: 30 }, { path: "/shop" }),
      ev("c3", "u3", 520_000, "page_time", { seconds: 99 }, { path: "/rare" }),
    ]);
  });

  it("reports cart and checkout behaviour: abandonment, coupons, shipping and the form drop-off", () => {
    const { cart } = store.summary(7, NOW, 0);
    expect(cart).toMatchObject({ addedToCartSessions: 2, cartViewSessions: 1, checkoutSessions: 1 });
    expect(cart.abandonmentRate).toBe(0.5);
    expect(cart.couponTries).toEqual({ total: 2, failed: 1 });
    expect(Object.fromEntries(cart.shipping.map((row) => [row.method, row.count]))).toEqual({ local_pickup: 1, pisol_extended_flat_shipping: 1 });
    expect(Object.fromEntries(cart.checkoutFields.map((row) => [row.field, row.sessions]))).toEqual({ email: 2, city: 1 });
  });

  it("lists failures and missing pages", () => {
    const { problems } = store.summary(7, NOW, 0);
    expect(problems.errors).toEqual([
      { kind: "api", where: "GET /api/products", count: 2 },
      { kind: "image", where: "/wp-content/uploads/a.jpg", count: 1 },
    ]);
    expect(problems.notFound).toEqual([{ path: "/old-page", count: 1 }]);
  });

  it("measures speed with percentiles, a slow share, devices and the slowest pages", () => {
    const { speed } = store.summary(7, NOW, 0);
    expect(speed.samples).toBe(4);
    expect(speed.lcpMedianMs).toBe(2500);
    expect(speed.lcpP75Ms).toBe(3250);
    expect(speed.slowShare).toBe(0.5);
    expect(Object.fromEntries(speed.byDevice.map((row) => [row.device, row.samples]))).toEqual({ mobile: 3, desktop: 1 });
    expect(speed.slowestPages).toEqual([{ path: "/shop", p75Ms: 2500, samples: 3 }]);
  });

  it("reports returning visitors, scroll depth, time on page and repeated fast clicks", () => {
    const { engagement } = store.summary(7, NOW, 0);
    expect(engagement.returningShare).toBe(0.333);
    expect(engagement.scroll).toEqual([
      { pct: 25, pageViews: 2 },
      { pct: 50, pageViews: 1 },
      { pct: 75, pageViews: 0 },
      { pct: 100, pageViews: 0 },
    ]);
    expect(engagement.timeOnPage).toEqual([{ path: "/shop", avgSeconds: 20, samples: 3 }]);
    expect(engagement.rageClicks).toEqual([{ target: "hero:cta", count: 2 }]);
  });
});
