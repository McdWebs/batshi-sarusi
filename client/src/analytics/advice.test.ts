import { describe, expect, it } from "vitest";
import type { AnalyticsSummary, Kpis } from "../api/types";
import { buildInsights, buildSummary, MAX_INSIGHTS, people, times } from "./advice";

const kpis = (over: Partial<Kpis> = {}): Kpis => ({ visitors: 100, sessions: 120, pageViews: 300, pagesPerSession: 2.5, bounceRate: 0.4, avgSessionSeconds: 60, ...over });

function summary(over: Partial<AnalyticsSummary> = {}): AnalyticsSummary {
  return {
    range: { from: 0, to: 1, days: 7 },
    hasDemoData: false,
    kpis: kpis(),
    previous: kpis({ visitors: 100 }),
    daily: [],
    sources: [],
    devices: [],
    funnel: [],
    topProducts: [],
    viewedNeverAdded: [],
    soldOut: [],
    searches: { total: 0, zeroResultRate: 0, top: [], zeroResults: [] },
    sorting: [],
    pagination: { changes: 0, deepestPage: 1 },
    clicks: [],
    topPages: [],
    cart: { addedToCartSessions: 0, cartViewSessions: 0, checkoutSessions: 0, abandonmentRate: 0, couponTries: { total: 0, failed: 0 }, shipping: [], checkoutFields: [] },
    problems: { errors: [], notFound: [] },
    speed: { samples: 0, lcpMedianMs: 0, lcpP75Ms: 0, slowShare: 0, byDevice: [], slowestPages: [] },
    engagement: { returningShare: 0, scroll: [], timeOnPage: [], rageClicks: [] },
    ...over,
  };
}

describe("wording helpers", () => {
  it("uses natural Hebrew for one and many", () => {
    expect(times(1)).toBe("פעם אחת");
    expect(times(4)).toBe("4 פעמים");
    expect(people(1)).toBe("אדם אחד");
    expect(people(12)).toBe("12 אנשים");
  });
});

describe("buildInsights", () => {
  it("says nothing when there is no traffic, and nothing alarming from a handful of visits", () => {
    expect(buildInsights(summary({ kpis: kpis({ sessions: 0, visitors: 0 }) }))).toEqual([]);
    const tiny = summary({
      searches: { total: 2, zeroResultRate: 0.5, top: [], zeroResults: [{ query: "x", count: 1 }] },
      cart: { addedToCartSessions: 2, cartViewSessions: 2, checkoutSessions: 0, abandonmentRate: 1, couponTries: { total: 2, failed: 2 }, shipping: [], checkoutFields: [] },
    });
    expect(buildInsights(tiny)).toEqual([]);
  });

  it("names the search people made that found nothing", () => {
    const result = buildInsights(summary({ searches: { total: 40, zeroResultRate: 0.15, top: [], zeroResults: [{ query: "טוסטר", count: 5 }, { query: "מגבות ים", count: 2 }] } }));
    const search = result.find((item) => item.id === "zero-search")!;
    expect(search.title).toBe('אנשים חיפשו "טוסטר" ולא מצאו');
    expect(search.detail).toContain("5 פעמים");
    expect(search.detail).toContain("ועוד חיפוש אחד אחר בלי תוצאות");
    expect(search.tab).toBe("searches");
    expect(search.tone).toBe("attention");
  });

  it("flags a sold-out product people want, and a cart that is mostly abandoned", () => {
    const result = buildInsights(
      summary({
        soldOut: [{ productId: 9, name: "קנקן זכוכית", views: 6, signups: 3 }],
        cart: { addedToCartSessions: 20, cartViewSessions: 15, checkoutSessions: 5, abandonmentRate: 0.75, couponTries: { total: 0, failed: 0 }, shipping: [], checkoutFields: [] },
      }),
    );
    expect(result[0]!.id).toBe("cart-abandonment");
    expect(result[0]!.tone).toBe("problem");
    expect(result[0]!.title).toContain("75%");
    expect(result.find((item) => item.id === "sold-out-demand")!.detail).toContain("3 בקשות");
  });

  it("finds the biggest drop in the checkout form, in the order of the real form", () => {
    const result = buildInsights(
      summary({
        cart: {
          addedToCartSessions: 40, cartViewSessions: 30, checkoutSessions: 30, abandonmentRate: 0.1, couponTries: { total: 0, failed: 0 }, shipping: [],
          checkoutFields: [{ field: "city", sessions: 6 }, { field: "first_name", sessions: 30 }, { field: "postcode", sessions: 24 }],
        },
      }),
    );
    const drop = result.find((item) => item.id === "checkout-drop")!;
    expect(drop.title).toContain("עיר");
    expect(drop.detail).toContain("24 אנשים");
  });

  it("ranks problems before attention before good news, and never returns more than the limit", () => {
    const many = summary({
      kpis: kpis({ visitors: 200, sessions: 240 }),
      previous: kpis({ visitors: 100 }),
      searches: { total: 40, zeroResultRate: 0.3, top: [], zeroResults: [{ query: "א", count: 9 }] },
      soldOut: [{ productId: 1, name: "ב", views: 5, signups: 2 }],
      viewedNeverAdded: [{ productId: 2, name: "ג", views: 9 }],
      cart: { addedToCartSessions: 30, cartViewSessions: 20, checkoutSessions: 5, abandonmentRate: 0.8, couponTries: { total: 10, failed: 8 }, shipping: [], checkoutFields: [] },
      speed: { samples: 100, lcpMedianMs: 3000, lcpP75Ms: 4500, slowShare: 0.5, byDevice: [{ device: "mobile", medianMs: 3400, samples: 80 }], slowestPages: [] },
      problems: { errors: [{ kind: "api", where: "GET /api/products", count: 40 }], notFound: [{ path: "/%D7%90", count: 7 }] },
      engagement: { returningShare: 0.3, scroll: [], timeOnPage: [], rageClicks: [{ target: "hero:cta", count: 4 }] },
      sources: [{ source: "instagram", sessions: 150 }],
    });
    const result = buildInsights(many);
    expect(result.length).toBeLessThanOrEqual(MAX_INSIGHTS);
    const order = { problem: 0, attention: 1, good: 2, info: 3 } as const;
    const ranks = result.map((item) => order[item.tone]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(result[0]!.tone).toBe("problem");
  });

  it("reports slow and fast sites, and visitor trends, with enough data only", () => {
    expect(buildInsights(summary({ speed: { samples: 10, lcpMedianMs: 9000, lcpP75Ms: 9000, slowShare: 1, byDevice: [], slowestPages: [] } })).some((item) => item.id === "slow-site")).toBe(false);
    expect(buildInsights(summary({ speed: { samples: 80, lcpMedianMs: 1200, lcpP75Ms: 1800, slowShare: 0.05, byDevice: [], slowestPages: [] } })).find((item) => item.id === "fast-site")!.tone).toBe("good");
    expect(buildInsights(summary({ kpis: kpis({ visitors: 60 }), previous: kpis({ visitors: 100 }) })).find((item) => item.id === "visitors-down")!.title).toContain("40%");
    expect(buildInsights(summary({ kpis: kpis({ visitors: 130 }), previous: kpis({ visitors: 100 }) })).find((item) => item.id === "visitors-up")!.tone).toBe("good");
  });
});

describe("buildSummary", () => {
  it("writes the week in one or two plain sentences", () => {
    const text = buildSummary(
      summary({
        kpis: kpis({ visitors: 236 }),
        previous: kpis({ visitors: 217 }),
        cart: { addedToCartSessions: 81, cartViewSessions: 55, checkoutSessions: 30, abandonmentRate: 0.63, couponTries: { total: 0, failed: 0 }, shipping: [], checkoutFields: [] },
      }),
    );
    expect(text).toBe("ב-7 הימים האחרונים ביקרו באתר 236 אנשים, 9% יותר לעומת 7 הימים הקודמים. 81 אנשים הוסיפו מוצר לעגלה, ו-30 הגיעו עד דף התשלום.");
  });

  it("does not compare with an earlier period that had too few visitors to mean anything", () => {
    const text = buildSummary(summary({ kpis: kpis({ visitors: 904 }), previous: kpis({ visitors: 5 }) }));
    expect(text.startsWith("ב-7 הימים האחרונים ביקרו באתר 904 אנשים.")).toBe(true);
    expect(text).not.toContain("%");
  });

  it("handles no data and no carts", () => {
    expect(buildSummary(summary({ kpis: kpis({ sessions: 0, visitors: 0 }) }))).toBe("עדיין אין נתונים לתקופה הזו.");
    expect(buildSummary(summary())).toContain("אף אחד לא הוסיף מוצר לעגלה");
  });
});
