/** The shape GET /api/studio/analytics/summary returns. The dashboard page is built against this. */

export type Kpis = {
  visitors: number;
  sessions: number;
  pageViews: number;
  /** Page views divided by sessions. */
  pagesPerSession: number;
  /** Share (0 to 1) of sessions that viewed exactly one page. */
  bounceRate: number;
  /** Average time between the first and last event of a session that had more than one event. */
  avgSessionSeconds: number;
};

export type FunnelStep = "visit" | "product_view" | "add_to_cart" | "cart_view" | "checkout_view";

export type AnalyticsSummary = {
  range: { from: number; to: number; days: number };
  /** True when some events in the store were created by the demo seed script, not by real visitors. */
  hasDemoData: boolean;
  kpis: Kpis;
  /** The same numbers for the period of equal length right before this one. */
  previous: Kpis;
  /** One row per day in the range (Israel time), including days with no traffic. */
  daily: Array<{ day: string; visitors: number; sessions: number }>;
  /** Where sessions started: instagram, influencer:<ref>, google, whatsapp, facebook, direct, or a site host. */
  sources: Array<{ source: string; sessions: number }>;
  devices: Array<{ device: "mobile" | "tablet" | "desktop"; sessions: number }>;
  /** Sessions that reached each step. Steps are counted separately, not strictly nested. */
  funnel: Array<{ step: FunnelStep; sessions: number }>;
  topProducts: Array<{ productId: number; name: string; views: number; adds: number }>;
  viewedNeverAdded: Array<{ productId: number; name: string; views: number }>;
  soldOut: Array<{ productId: number; name: string; views: number; signups: number }>;
  searches: {
    total: number;
    /** Share (0 to 1) of searches that found nothing. */
    zeroResultRate: number;
    top: Array<{ query: string; count: number; avgResults: number }>;
    zeroResults: Array<{ query: string; count: number }>;
  };
  /** How often each sort option was chosen, as "orderby:order" (for example "price:asc"). */
  sorting: Array<{ option: string; count: number }>;
  pagination: { changes: number; deepestPage: number };
  /** Clicks on elements marked with data-track, by their id. */
  clicks: Array<{ id: string; count: number }>;
  topPages: Array<{ path: string; views: number }>;
};
