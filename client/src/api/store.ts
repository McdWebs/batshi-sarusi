import { apiRequest } from "./client";
import type { Brand, Cart, Category, CmsPage, Paginated, Product, ProductQuery } from "./types";

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
      orderby: query.orderby,
      order: query.order,
    },
  });
}

export function getCategories(page = 1, perPage = 100) {
  return apiRequest<Paginated<Category>>("/api/categories", { query: { page, perPage } });
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
