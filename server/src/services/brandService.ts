import { listBrands } from "../integrations/woocommerce/brands.js";
import { mapBrand } from "../integrations/woocommerce/mappers.js";
import type { Brand, Paginated } from "../types/api.js";
import { TAXONOMY_TTL_MS, cacheKey, cached } from "../utils/cache.js";

export async function getBrandsPage(query: { page?: number; perPage?: number }): Promise<Paginated<Brand>> {
  const page = query.page ?? 1;
  const perPage = query.perPage ?? 100;
  return cached(cacheKey(["brands", page, perPage]), TAXONOMY_TTL_MS, async () => {
    const result = await listBrands({ page, perPage });
    return {
      items: (result.data ?? []).map(mapBrand),
      page,
      perPage,
      total: result.total ?? (result.data ?? []).length,
      totalPages: result.totalPages ?? 1,
    };
  });
}
