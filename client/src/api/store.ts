import { apiRequest } from "./client";
import { getStudioKey } from "../studio/studioKey";
import type { AnalyticsSummary, Brand, Cart, Category, CmsPage, DemandRow, Paginated, Product, ProductQuery, StudioContent, StudioResult, StudioSample } from "./types";

export function getProducts(query: ProductQuery = {}) {
  return apiRequest<Paginated<Product>>("/api/products", {
    query: {
      page: query.page,
      perPage: query.perPage,
      search: query.search,
      category: query.category,
      brand: query.brand,
      type: query.type,
      onSale: query.onSale,
      featured: query.featured,
      stockStatus: query.stockStatus,
      orderby: query.orderby,
      order: query.order,
    },
  });
}

export function getProduct(idOrSlug: string) {
  return apiRequest<Product>(`/api/products/${encodeURIComponent(idOrSlug)}`);
}

export function searchProducts(q: string, query: ProductQuery = {}) {
  return apiRequest<Paginated<Product>>("/api/search", {
    query: {
      q,
      page: query.page,
      perPage: query.perPage,
      stockStatus: query.stockStatus,
      orderby: query.orderby,
      order: query.order,
    },
  });
}

export function getCategories(page = 1, perPage = 100, all = false) {
  return apiRequest<Paginated<Category>>("/api/categories", { query: { page, perPage, all: all ? true : undefined } });
}

export function getCategoryPreviews(ids: number[]) {
  if (ids.length === 0) return Promise.resolve({} as Record<number, { src: string; alt: string } | null>);
  return apiRequest<Record<number, { src: string; alt: string } | null>>("/api/categories/previews", {
    query: { ids: ids.join(",") },
  });
}

export function getBrands() {
  return apiRequest<Paginated<Brand>>("/api/brands", { query: { page: 1, perPage: 100 } });
}

export function getCart() {
  return apiRequest<Cart>("/api/cart", { cart: true });
}

export function addCartItem(body: { id: number; quantity: number; variation?: Array<{ attribute: string; value: string }> }) {
  return apiRequest<Cart>("/api/cart/items", { method: "POST", body, cart: true });
}

export function updateCartItem(key: string, quantity: number) {
  return apiRequest<Cart>(`/api/cart/items/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: { quantity },
    cart: true,
  });
}

export function removeCartItem(key: string) {
  return apiRequest<Cart>(`/api/cart/items/${encodeURIComponent(key)}`, {
    method: "DELETE",
    cart: true,
  });
}

export function applyCoupon(code: string) {
  return apiRequest<Cart>("/api/cart/coupon", { method: "POST", body: { code }, cart: true });
}

export function removeCoupon(code: string) {
  return apiRequest<Cart>("/api/cart/coupon", { method: "DELETE", query: { code }, cart: true });
}

export function selectShippingRate(packageId: number, rateId: string) {
  return apiRequest<Cart>("/api/cart/shipping-rate", {
    method: "POST",
    body: { packageId, rateId },
    cart: true,
  });
}

export function getPages() {
  return apiRequest<CmsPage[]>("/api/pages");
}

export function getPage(slug: string) {
  return apiRequest<CmsPage>(`/api/pages/${encodeURIComponent(slug)}`);
}

export function getBanners() {
  return apiRequest<CmsPage[]>("/api/banners");
}

/** The studio routes are owner-only and need the access code the owner typed in. */
function studioHeaders(): Record<string, string> {
  const key = getStudioKey();
  return key ? { "X-Studio-Key": key } : {};
}

export function getStudioSample() {
  return apiRequest<{ items: StudioSample[]; aiConfigured: boolean }>("/api/studio/sample", { headers: studioHeaders() });
}

export function generateStudioContent(productId: number, revision?: { instruction: string; previous: StudioContent }) {
  return apiRequest<StudioResult>("/api/studio/generate", {
    method: "POST",
    headers: studioHeaders(),
    body: revision ? { productId, instruction: revision.instruction, previous: revision.previous } : { productId },
  });
}

/** Public: a shopper asks to be told when a sold-out product is back. */
export function subscribeBackInStock(productId: number, email: string) {
  return apiRequest<{ alreadySubscribed: boolean }>("/api/back-in-stock", { method: "POST", body: { productId, email } });
}

/** Owner-only: sold-out products ranked by how many people are waiting. */
export function getDemandRanking() {
  return apiRequest<{ items: DemandRow[] }>("/api/studio/back-in-stock", { headers: studioHeaders() });
}

/** Owner-only: the site analytics summary for the last `days` days (1, 7, 30 or 90). */
export function getAnalyticsSummary(days: number) {
  return apiRequest<AnalyticsSummary>("/api/studio/analytics/summary", { query: { days }, headers: studioHeaders() });
}
