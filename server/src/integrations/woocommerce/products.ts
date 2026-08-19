import { storeApiRequest } from "./client.js";
import type { WooProduct } from "./types.js";

export type ProductListQuery = {
  page?: number;
  perPage?: number;
  search?: string;
  category?: number;
  brand?: number;
  type?: string;
  onSale?: boolean;
  featured?: boolean;
  stockStatus?: string;
  orderby?: string;
  order?: "asc" | "desc";
};

export async function listProducts(query: ProductListQuery) {
  return storeApiRequest<WooProduct[]>({
    method: "GET",
    path: "/products",
    query: {
      page: query.page,
      per_page: query.perPage,
      search: query.search,
      category: query.category,
      brand: query.brand,
      type: query.type,
      on_sale: query.onSale,
      featured: query.featured,
      stock_status: query.stockStatus,
      orderby: query.orderby,
      order: query.order,
    },
  });
}

export async function getProduct(idOrSlug: string) {
  const encoded = encodeURIComponent(idOrSlug);
  return storeApiRequest<WooProduct>({
    method: "GET",
    path: `/products/${encoded}`,
  });
}
