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
  cart: CartInsights;
  problems: Problems;
  speed: Speed;
  engagement: Engagement;
};

export type CartInsights = {
  /** Sessions that added something to the cart. */
  addedToCartSessions: number;
  cartViewSessions: number;
  checkoutSessions: number;
  /** Share (0 to 1) of sessions that added something to the cart and never opened checkout. */
  abandonmentRate: number;
  couponTries: { total: number; failed: number };
  /** Shipping methods chosen in the cart or checkout, by WooCommerce method id (for example "local_pickup"). */
  shipping: Array<{ method: string; count: number }>;
  /** For each checkout form field, how many sessions focused it. The drop-off is where the numbers fall. */
  checkoutFields: Array<{ field: string; sessions: number }>;
};

export type Problems = {
  /** Failed API calls, broken images and script errors, with where they happened. */
  errors: Array<{ kind: "api" | "image" | "script"; where: string; count: number }>;
  /** Visitors who landed on a page that does not exist. */
  notFound: Array<{ path: string; count: number }>;
};

export type Speed = {
  /** Page loads that reported a Largest Contentful Paint (when the main content appeared). */
  samples: number;
  lcpMedianMs: number;
  lcpP75Ms: number;
  /** Share (0 to 1) of loads slower than 2.5 seconds, the "needs improvement" line. */
  slowShare: number;
  byDevice: Array<{ device: "mobile" | "tablet" | "desktop"; medianMs: number; samples: number }>;
  /** Pages with at least 3 samples, slowest first by 75th percentile. */
  slowestPages: Array<{ path: string; p75Ms: number; samples: number }>;
};

export type Engagement = {
  /** Share (0 to 1) of sessions that came from a visitor who had been here before. */
  returningShare: number;
  /** How many page views scrolled at least this far (compare with kpis.pageViews). */
  scroll: Array<{ pct: 25 | 50 | 75 | 100; pageViews: number }>;
  /** Average seconds visitors spent on a page (pages with at least 3 samples, longest first). */
  timeOnPage: Array<{ path: string; avgSeconds: number; samples: number }>;
  /** Targets that visitors clicked three or more times in a row (a sign that something looks clickable but is not working). */
  rageClicks: Array<{ target: string; count: number }>;
};
