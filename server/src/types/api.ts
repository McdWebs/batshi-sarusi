import type { CurrencyFormat, Money, PricedAmount } from "../utils/money.js";

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

export type ProductAttribute = {
  id: number;
  name: string;
  taxonomy: string;
  hasVariations: boolean;
  terms: Array<{ id: number; name: string; slug: string }>;
};

export type ProductVariationRef = {
  id: number;
  attributes: Array<{ name: string; value: string }>;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  type: string;
  variation: string;
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
  attributes: ProductAttribute[];
  variations: ProductVariationRef[];
  groupedProducts: number[];
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

export type CartTotals = CurrencyFormat & {
  totalItems: Money;
  totalItemsTax: Money;
  totalFees: Money;
  totalFeesTax: Money;
  totalDiscount: Money;
  totalDiscountTax: Money;
  totalShipping: Money | null;
  totalShippingTax: Money | null;
  totalPrice: Money;
  totalTax: Money;
  taxLines: Array<{ name: string; price: Money; rate: string }>;
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
  shortDescription: string;
  sku: string;
  lowStockRemaining: number | null;
  soldIndividually: boolean;
  permalink: string;
  images: Image[];
  variation: Array<{ attribute: string; value: string }>;
  prices: PricedAmount | null;
  totals: CartTotals;
};

export type ShippingRate = CurrencyFormat & {
  rateId: string;
  name: string;
  description: string;
  deliveryTime: string;
  price: Money;
  instanceId: number;
  methodId: string;
  selected: boolean;
  meta: Array<{ key: string; value: unknown }>;
};

export type ShippingPackage = {
  packageId: number;
  name: string;
  destination: Address;
  items: Array<{ key: string; name: string; quantity: number }>;
  rates: ShippingRate[];
};

export type CartCoupon = {
  code: string;
  discountType: string;
  totals: CartTotals | null;
};

export type Cart = {
  items: CartItem[];
  coupons: CartCoupon[];
  fees: unknown[];
  totals: CartTotals;
  shippingAddress: Address;
  billingAddress: Address;
  needsPayment: boolean;
  needsShipping: boolean;
  hasCalculatedShipping: boolean;
  shippingRates: ShippingPackage[];
  itemsCount: number;
  itemsWeight: number;
  crossSells: Product[];
  errors: Array<{ code: string; message: string }>;
  paymentMethodIds: string[];
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
