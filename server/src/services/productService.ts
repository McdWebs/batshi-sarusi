import { listProducts, getProduct } from "../integrations/woocommerce/products.js";
import { mapProduct } from "../integrations/woocommerce/mappers.js";
import type { Paginated, Product } from "../types/api.js";
import type { ProductListQuery } from "../integrations/woocommerce/products.js";
import { CATALOG_TTL_MS, cacheKey, cached } from "../utils/cache.js";

export async function getProductsPage(query: ProductListQuery): Promise<Paginated<Product>> {
  const page = query.page ?? 1;
  const perPage = query.perPage ?? 24;
  const key = cacheKey([
    "products",
    page,
    perPage,
    query.search,
    query.category,
    query.brand,
    query.type,
    query.onSale,
    query.featured,
    query.stockStatus,
    query.orderby,
    query.order,
  ]);
  return cached(key, CATALOG_TTL_MS, async () => {
    const result = await listProducts({ ...query, page, perPage });
    return {
      items: (result.data ?? []).map(mapProduct),
      page,
      perPage,
      total: result.total ?? (result.data ?? []).length,
      totalPages: result.totalPages ?? 1,
    };
  });
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product> {
  return cached(cacheKey(["product", idOrSlug]), CATALOG_TTL_MS, async () => {
    const result = await getProduct(idOrSlug);
    return mapProduct(result.data);
  });
}
