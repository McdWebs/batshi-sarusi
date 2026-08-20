import { decodeEntities } from "../../utils/html.js";
import { readCurrencyFormat, toMoney, toPricedAmount } from "../../utils/money.js";
import type {
  Address,
  Brand,
  Cart,
  CartCoupon,
  CartItem,
  CartItemTotals,
  CartTotals,
  Category,
  Image,
  Product,
  ShippingPackage,
  ShippingRate,
  TermRef,
} from "../../types/api.js";
import type {
  WooAddress,
  WooBrand,
  WooCart,
  WooCartCoupon,
  WooCartItem,
  WooCartItemTotals,
  WooCartTotals,
  WooCategory,
  WooImage,
  WooProduct,
  WooShippingPackage,
  WooShippingRate,
  WooTermRef,
} from "./types.js";

function decodeUri(value: string) {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

function mapImage(image: WooImage): Image {
  return {
    id: image.id ?? 0,
    src: image.src ?? "",
    thumbnail: image.thumbnail ?? "",
    srcset: image.srcset ?? "",
    sizes: image.sizes ?? "",
    name: decodeEntities(image.name ?? ""),
    alt: decodeEntities(image.alt ?? ""),
  };
}

function mapTerm(term: WooTermRef): TermRef {
  return {
    id: term.id ?? 0,
    name: decodeEntities(term.name ?? ""),
    slug: decodeUri(term.slug ?? ""),
    link: term.link ?? "",
  };
}

export function mapAddress(address: WooAddress | undefined): Address {
  return {
    firstName: address?.first_name ?? "",
    lastName: address?.last_name ?? "",
    company: address?.company ?? "",
    address1: address?.address_1 ?? "",
    address2: address?.address_2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postcode: address?.postcode ?? "",
    country: address?.country ?? "",
    phone: address?.phone ?? "",
    email: address?.email,
  };
}

export function mapProduct(product: WooProduct): Product {
  return {
    id: product.id,
    name: decodeEntities(product.name ?? ""),
    slug: decodeUri(product.slug ?? ""),
    parent: product.parent ?? 0,
    type: product.type ?? "",
    variation: product.variation ?? "",
    permalink: product.permalink ?? "",
    sku: product.sku ?? "",
    shortDescription: product.short_description ?? "",
    description: product.description ?? "",
    onSale: Boolean(product.on_sale),
    prices: toPricedAmount(product.prices),
    averageRating: product.average_rating ?? "0",
    reviewCount: product.review_count ?? 0,
    images: (product.images ?? []).map(mapImage),
    categories: (product.categories ?? []).map(mapTerm),
    tags: (product.tags ?? []).map(mapTerm),
    brands: (product.brands ?? []).map(mapTerm),
    attributes: (product.attributes ?? []).map((attribute) => ({
      id: attribute.id ?? 0,
      name: decodeEntities(attribute.name ?? ""),
      taxonomy: attribute.taxonomy ?? "",
      hasVariations: Boolean(attribute.has_variations),
      terms: (attribute.terms ?? []).map((term) => ({
        id: term.id ?? 0,
        name: decodeEntities(term.name ?? ""),
        slug: decodeUri(term.slug ?? ""),
      })),
    })),
    variations: (product.variations ?? []).map((variation) => ({
      id: variation.id ?? 0,
      attributes: (variation.attributes ?? []).map((item) => ({
        name: item.name ?? "",
        value: item.value ?? "",
      })),
    })),
    groupedProducts: product.grouped_products ?? [],
    hasOptions: Boolean(product.has_options),
    isPurchasable: Boolean(product.is_purchasable),
    isInStock: Boolean(product.is_in_stock),
    isOnBackorder: Boolean(product.is_on_backorder),
    lowStockRemaining: product.low_stock_remaining ?? null,
    stockAvailability: {
      text: product.stock_availability?.text ?? "",
      className: product.stock_availability?.class ?? "",
    },
    soldIndividually: Boolean(product.sold_individually),
    addToCart: {
      text: product.add_to_cart?.text ?? "",
      description: product.add_to_cart?.description ?? "",
      singleText: product.add_to_cart?.single_text ?? "",
      minimum: product.add_to_cart?.minimum ?? 1,
      maximum: product.add_to_cart?.maximum ?? 1,
      multipleOf: product.add_to_cart?.multiple_of ?? 1,
    },
  };
}

export function mapCategory(category: WooCategory): Category {
  return {
    id: category.id,
    name: decodeEntities(category.name ?? ""),
    slug: decodeUri(category.slug ?? ""),
    description: category.description ?? "",
    parent: category.parent ?? 0,
    count: category.count ?? 0,
    image: category.image ? mapImage(category.image) : null,
    permalink: category.permalink ?? "",
  };
}

export function mapBrand(brand: WooBrand): Brand {
  return {
    id: brand.id,
    name: decodeEntities(brand.name ?? ""),
    slug: decodeUri(brand.slug ?? ""),
    description: brand.description ?? "",
    parent: brand.parent ?? 0,
    count: brand.count ?? 0,
    image: brand.image ? mapImage(brand.image) : null,
    permalink: brand.permalink ?? "",
  };
}

export function mapCartTotals(totals: WooCartTotals | undefined): CartTotals {
  const format = readCurrencyFormat(totals ?? {});
  const unit = format.currencyMinorUnit;
  return {
    ...format,
    totalItems: toMoney(totals?.total_items, unit),
    totalItemsTax: toMoney(totals?.total_items_tax, unit),
    totalFees: toMoney(totals?.total_fees, unit),
    totalFeesTax: toMoney(totals?.total_fees_tax, unit),
    totalDiscount: toMoney(totals?.total_discount, unit),
    totalDiscountTax: toMoney(totals?.total_discount_tax, unit),
    totalShipping: totals?.total_shipping == null ? null : toMoney(totals.total_shipping, unit),
    totalShippingTax: totals?.total_shipping_tax == null ? null : toMoney(totals.total_shipping_tax, unit),
    totalPrice: toMoney(totals?.total_price, unit),
    totalTax: toMoney(totals?.total_tax, unit),
    taxLines: (totals?.tax_lines ?? []).map((line) => ({
      name: line.name ?? "",
      price: toMoney(line.price, unit),
      rate: line.rate ?? "",
    })),
  };
}

export function mapCartItemTotals(totals: WooCartItemTotals | undefined): CartItemTotals {
  const format = readCurrencyFormat(totals ?? {});
  const unit = format.currencyMinorUnit;
  const lineTotal = toMoney(totals?.line_total, unit);
  return {
    totalPrice: lineTotal,
    lineSubtotal: toMoney(totals?.line_subtotal, unit),
    lineSubtotalTax: toMoney(totals?.line_subtotal_tax, unit),
    lineTotal,
    lineTotalTax: toMoney(totals?.line_total_tax, unit),
  };
}

function mapCartItem(item: WooCartItem): CartItem {
  return {
    key: item.key ?? "",
    id: item.id ?? 0,
    type: item.type ?? "",
    quantity: item.quantity ?? 0,
    quantityLimits: {
      minimum: item.quantity_limits?.minimum ?? 1,
      maximum: item.quantity_limits?.maximum ?? 1,
      multipleOf: item.quantity_limits?.multiple_of ?? 1,
      editable: item.quantity_limits?.editable ?? true,
    },
    name: decodeEntities(item.name ?? ""),
    shortDescription: item.short_description ?? "",
    sku: item.sku ?? "",
    lowStockRemaining: item.low_stock_remaining ?? null,
    soldIndividually: Boolean(item.sold_individually),
    permalink: item.permalink ?? "",
    images: (item.images ?? []).map(mapImage),
    variation: (item.variation ?? []).map((entry) => ({
      attribute: entry.attribute ?? "",
      value: entry.value ?? "",
    })),
    prices: toPricedAmount(item.prices),
    totals: mapCartItemTotals(item.totals),
  };
}

function mapShippingRate(rate: WooShippingRate): ShippingRate {
  const format = readCurrencyFormat(rate);
  return {
    ...format,
    rateId: rate.rate_id ?? "",
    name: decodeEntities(rate.name ?? ""),
    description: decodeEntities(rate.description ?? ""),
    deliveryTime: decodeEntities(rate.delivery_time ?? ""),
    price: toMoney(rate.price, format.currencyMinorUnit),
    instanceId: rate.instance_id ?? 0,
    methodId: rate.method_id ?? "",
    selected: Boolean(rate.selected),
    meta: (rate.meta_data ?? []).map((entry) => ({
      key: entry.key ?? "",
      value: entry.value,
    })),
  };
}

function mapShippingPackage(pkg: WooShippingPackage): ShippingPackage {
  return {
    packageId: pkg.package_id ?? 0,
    name: decodeEntities(pkg.name ?? ""),
    destination: mapAddress(pkg.destination),
    items: (pkg.items ?? []).map((item) => ({
      key: item.key ?? "",
      name: decodeEntities(item.name ?? ""),
      quantity: item.quantity ?? 0,
    })),
    rates: (pkg.shipping_rates ?? []).map(mapShippingRate),
  };
}

function mapCoupon(coupon: WooCartCoupon): CartCoupon {
  return {
    code: coupon.code ?? "",
    discountType: coupon.discount_type ?? "",
    totals: coupon.totals ? mapCartTotals(coupon.totals) : null,
  };
}

export function mapCart(cart: WooCart): Cart {
  return {
    items: (cart.items ?? []).map(mapCartItem),
    coupons: (cart.coupons ?? []).map(mapCoupon),
    fees: cart.fees ?? [],
    totals: mapCartTotals(cart.totals),
    shippingAddress: mapAddress(cart.shipping_address),
    billingAddress: mapAddress(cart.billing_address),
    needsPayment: Boolean(cart.needs_payment),
    needsShipping: Boolean(cart.needs_shipping),
    hasCalculatedShipping: Boolean(cart.has_calculated_shipping),
    shippingRates: (cart.shipping_rates ?? []).map(mapShippingPackage),
    itemsCount: cart.items_count ?? 0,
    itemsWeight: cart.items_weight ?? 0,
    crossSells: (cart.cross_sells ?? []).map(mapProduct),
    errors: (cart.errors ?? []).map((error) => ({
      code: error.code ?? "",
      message: error.message ?? "",
    })),
    paymentMethodIds: cart.payment_methods ?? [],
  };
}

export function toWooAddress(address: Partial<Address> | undefined): WooAddress | undefined {
  if (!address) {
    return undefined;
  }
  const payload: WooAddress = {};
  if (address.firstName !== undefined) payload.first_name = address.firstName;
  if (address.lastName !== undefined) payload.last_name = address.lastName;
  if (address.company !== undefined) payload.company = address.company;
  if (address.address1 !== undefined) payload.address_1 = address.address1;
  if (address.address2 !== undefined) payload.address_2 = address.address2;
  if (address.city !== undefined) payload.city = address.city;
  if (address.state !== undefined) payload.state = address.state;
  if (address.postcode !== undefined) payload.postcode = address.postcode;
  if (address.country !== undefined) payload.country = address.country;
  if (address.phone !== undefined) payload.phone = address.phone;
  if (address.email !== undefined) payload.email = address.email;
  return payload;
}
