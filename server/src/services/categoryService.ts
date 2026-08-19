import { listCategories } from "../integrations/woocommerce/categories.js";
import { mapCategory } from "../integrations/woocommerce/mappers.js";
import type { Category, Paginated } from "../types/api.js";

export async function getCategoriesPage(query: {
  page?: number;
  perPage?: number;
}): Promise<Paginated<Category>> {
  const page = query.page ?? 1;
  const perPage = query.perPage ?? 100;
  const result = await listCategories({ page, perPage });
  return {
    items: (result.data ?? []).map(mapCategory),
    page,
    perPage,
    total: result.total ?? (result.data ?? []).length,
    totalPages: result.totalPages ?? 1,
  };
}
