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
