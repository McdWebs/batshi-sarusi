export type WooPrice = {
  price?: string;
  regular_price?: string;
  sale_price?: string;
  price_range?: { min_amount?: string; max_amount?: string } | null;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type WooImage = {
  id?: number;
  src?: string;
  thumbnail?: string;
  srcset?: string;
  sizes?: string;
  name?: string;
  alt?: string;
};

export type WooTermRef = {
  id?: number;
  name?: string;
  slug?: string;
  link?: string;
};

export type WooAttributeTerm = {
  id?: number;
  name?: string;
  slug?: string;
};

export type WooProductAttribute = {
  id?: number;
  name?: string;
  taxonomy?: string;
  has_variations?: boolean;
  terms?: WooAttributeTerm[];
};

export type WooVariationRef = {
  id?: number;
  attributes?: Array<{ name?: string; value?: string }>;
};

export type WooAddToCart = {
  text?: string;
  description?: string;
  url?: string;
  single_text?: string;
  minimum?: number;
  maximum?: number;
  multiple_of?: number;
};

export type WooStockAvailability = {
  text?: string;
  class?: string;
};

export type WooProduct = {
  id: number;
  name?: string;
  slug?: string;
  parent?: number;
  type?: string;
  variation?: string;
  permalink?: string;
  sku?: string;
  short_description?: string;
  description?: string;
  on_sale?: boolean;
  prices?: WooPrice;
  price_html?: string;
  average_rating?: string;
  review_count?: number;
  images?: WooImage[];
  categories?: WooTermRef[];
  tags?: WooTermRef[];
  brands?: WooTermRef[];
  attributes?: WooProductAttribute[];
  variations?: WooVariationRef[];
  grouped_products?: number[];
  has_options?: boolean;
  is_purchasable?: boolean;
  is_in_stock?: boolean;
  is_on_backorder?: boolean;
  low_stock_remaining?: number | null;
  stock_availability?: WooStockAvailability;
  sold_individually?: boolean;
  add_to_cart?: WooAddToCart;
  extensions?: Record<string, unknown>;
};

export type WooCategory = {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  parent?: number;
  count?: number;
  image?: WooImage | null;
  review_count?: number;
  permalink?: string;
};

export type WooBrand = {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  parent?: number;
  count?: number;
  image?: WooImage | null;
  review_count?: number;
  permalink?: string;
};

export type WooAddress = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
};

export type WooShippingRate = {
  rate_id?: string;
  name?: string;
  description?: string;
  delivery_time?: string;
  price?: string;
  taxes?: string;
  instance_id?: number;
  method_id?: string;
  meta_data?: Array<{ key?: string; value?: unknown }>;
  selected?: boolean;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type WooShippingPackage = {
  package_id?: number;
  name?: string;
  destination?: WooAddress;
  items?: Array<{ key?: string; name?: string; quantity?: number }>;
  shipping_rates?: WooShippingRate[];
};

export type WooCartTotals = WooPrice & {
  total_items?: string;
  total_items_tax?: string;
  total_fees?: string;
  total_fees_tax?: string;
  total_discount?: string;
  total_discount_tax?: string;
  total_shipping?: string | null;
  total_shipping_tax?: string | null;
  total_price?: string;
  total_tax?: string;
  tax_lines?: Array<{ name?: string; price?: string; rate?: string }>;
};

/** Cart line item totals use line_* keys, not cart-level total_* keys. */
export type WooCartItemTotals = WooPrice & {
  line_subtotal?: string;
  line_subtotal_tax?: string;
  line_total?: string;
  line_total_tax?: string;
};

export type WooCartItem = {
  key?: string;
  id?: number;
  type?: string;
  quantity?: number;
  quantity_limits?: {
    minimum?: number;
    maximum?: number;
    multiple_of?: number;
    editable?: boolean;
  };
  name?: string;
  short_description?: string;
  description?: string;
  sku?: string;
  low_stock_remaining?: number | null;
  backorders_allowed?: boolean;
  show_backorder_badge?: boolean;
  sold_individually?: boolean;
  permalink?: string;
  images?: WooImage[];
  variation?: Array<{ attribute?: string; value?: string; raw_attribute?: string }>;
  prices?: WooPrice;
  totals?: WooCartItemTotals;
  catalog_visibility?: string;
  extensions?: Record<string, unknown>;
};

export type WooCartCoupon = {
  code?: string;
  discount_type?: string;
  totals?: WooCartTotals;
};

export type WooCart = {
  items?: WooCartItem[];
  coupons?: WooCartCoupon[];
  fees?: unknown[];
  totals?: WooCartTotals;
  shipping_address?: WooAddress;
  billing_address?: WooAddress;
  needs_payment?: boolean;
  needs_shipping?: boolean;
  payment_requirements?: string[];
  has_calculated_shipping?: boolean;
  shipping_rates?: WooShippingPackage[];
  items_count?: number;
  items_weight?: number;
  cross_sells?: WooProduct[];
  errors?: Array<{ code?: string; message?: string }>;
  payment_methods?: string[];
  extensions?: Record<string, unknown>;
};

export type WooErrorBody = {
  code?: string;
  message?: string;
  data?: { status?: number; params?: unknown; details?: unknown };
};

export type StoreApiSession = {
  cartToken: string | null;
  nonce: string | null;
  nonceTimestamp: string | null;
  cartHash: string | null;
};

export type StoreApiResult<T> = {
  data: T;
  status: number;
  total: number | null;
  totalPages: number | null;
  session: StoreApiSession;
};
