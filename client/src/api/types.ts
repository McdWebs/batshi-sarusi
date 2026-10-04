export type Money = {
  minor: string;
  major: string;
};

export type PricedAmount = {
  currencyCode: string;
  currencySymbol: string;
  currencyMinorUnit: number;
  currencyDecimalSeparator: string;
  currencyThousandSeparator: string;
  currencyPrefix: string;
  currencySuffix: string;
  price: Money;
  regularPrice: Money;
  salePrice: Money;
  priceRange: { minAmount: Money; maxAmount: Money } | null;
};

export type Image = {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
};

export type TermRef = {
  id: number;
  name: string;
  slug: string;
  link: string;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  type: string;
  permalink: string;
  sku: string;
  shortDescription: string;
  description: string;
  onSale: boolean;
  prices: PricedAmount | null;
  averageRating: string;
  reviewCount: number;
  images: Image[];
  categories: TermRef[];
  tags: TermRef[];
  brands: TermRef[];
  attributes: Array<{
    id: number;
    name: string;
    taxonomy: string;
    hasVariations: boolean;
    terms: Array<{ id: number; name: string; slug: string }>;
  }>;
  variations: Array<{ id: number; attributes: Array<{ name: string; value: string }> }>;
  hasOptions: boolean;
  isPurchasable: boolean;
  isInStock: boolean;
  isOnBackorder: boolean;
  lowStockRemaining: number | null;
  stockAvailability: { text: string; className: string };
  soldIndividually: boolean;
  addToCart: {
    text: string;
    description: string;
    singleText: string;
    minimum: number;
    maximum: number;
    multipleOf: number;
  };
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: Image | null;
  permalink: string;
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: Image | null;
  permalink: string;
};

export type CartItem = {
  key: string;
  id: number;
  type: string;
  quantity: number;
  quantityLimits: {
    minimum: number;
    maximum: number;
    multipleOf: number;
    editable: boolean;
  };
  name: string;
  sku: string;
  permalink: string;
  images: Image[];
  variation: Array<{ attribute: string; value: string }>;
  prices: PricedAmount | null;
  totals: { totalPrice: Money };
};

export type ShippingRate = {
  rateId: string;
  name: string;
  description: string;
  deliveryTime: string;
  price: Money;
  selected: boolean;
  methodId: string;
  instanceId: number;
};

export type Address = {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
};

export type Cart = {
  items: CartItem[];
  coupons: Array<{ code: string; discountType: string }>;
  totals: {
    currencyCode: string;
    currencySymbol: string;
    currencySuffix: string;
    totalItems: Money;
    totalDiscount: Money;
    totalShipping: Money | null;
    totalPrice: Money;
  };
  shippingAddress: Address;
  billingAddress: Address;
  needsPayment: boolean;
  needsShipping: boolean;
  hasCalculatedShipping: boolean;
  shippingRates: Array<{
    packageId: number;
    name: string;
    rates: ShippingRate[];
  }>;
  itemsCount: number;
  paymentMethodIds?: string[];
  errors: Array<{ code: string; message: string }>;
};

export type CartSession = {
  cartToken: string | null;
  nonce: string | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type CmsPage = {
  id: number;
  slug: string;
  link: string;
  title: string;
  contentHtml: string;
  excerptHtml: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  session?: CartSession;
};

export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

export type ProductQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  category?: number;
  brand?: number;
  type?: string;
  onSale?: boolean;
  featured?: boolean;
  stockStatus?: "instock" | "outofstock" | "onbackorder";
  orderby?: "date" | "price" | "title" | "menu_order" | "popularity" | "rating";
  order?: "asc" | "desc";
};

export type StudioSample = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  image: { src: string; thumbnail: string; alt: string } | null;
  categories: string[];
  attributes: Array<{ name: string; values: string[] }>;
  price: PricedAmount | null;
  before: { description: string; shortDescription: string; imageAlt: string };
};

export type StudioContent = {
  description: string;
  bullets: string[];
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
};

export type StudioResult = {
  productId: number;
  model: string;
  content: StudioContent;
};

export type DemandRow = {
  productId: number;
  name: string;
  slug: string;
  image: string | null;
  count: number;
  lastSignupAt: string;
};

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
