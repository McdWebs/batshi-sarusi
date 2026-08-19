import { listCategories } from "../integrations/woocommerce/categories.js";
import { mapCategory } from "../integrations/woocommerce/mappers.js";
import type { Category, Paginated } from "../types/api.js";
import { getProductsPage } from "./productService.js";
import { TAXONOMY_TTL_MS, cacheKey, cached } from "../utils/cache.js";

export async function getCategoriesPage(query: {
  page?: number;
  perPage?: number;
}): Promise<Paginated<Category>> {
  const page = query.page ?? 1;
  const perPage = query.perPage ?? 100;
  return cached(cacheKey(["categories", page, perPage]), TAXONOMY_TTL_MS, async () => {
    const result = await listCategories({ page, perPage });
    return {
      items: (result.data ?? []).map(mapCategory),
      page,
      perPage,
      total: result.total ?? (result.data ?? []).length,
      totalPages: result.totalPages ?? 1,
    };
  });
}

export async function getAllCategories(): Promise<Category[]> {
  return cached("categories:all", TAXONOMY_TTL_MS, async () => {
    const first = await getCategoriesPage({ page: 1, perPage: 100 });
    if (first.totalPages <= 1) return first.items;
    const rest = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, index) =>
        getCategoriesPage({ page: index + 2, perPage: 100 }),
      ),
    );
    return [...first.items, ...rest.flatMap((page) => page.items)];
  });
}

function imageKey(src: string) {
  return src.replace(/-\d+x\d+(?=\.\w+$)/, "").split("?")[0];
}

export type CategoryPreview = { src: string; alt: string };

export async function getCategoryPreviews(ids: number[]): Promise<Record<number, CategoryPreview | null>> {
  const uniqueIds = [...new Set(ids)].slice(0, 40);
  const pages = await Promise.all(
    uniqueIds.map((id) =>
      getProductsPage({ category: id, perPage: 8, orderby: "date", order: "desc" }),
    ),
  );

  const usedImages = new Set<string>();
  const usedProducts = new Set<number>();
  const previews: Record<number, CategoryPreview | null> = {};

  uniqueIds.forEach((id, index) => {
    previews[id] = null;
    for (const product of pages[index]?.items ?? []) {
      if (usedProducts.has(product.id)) continue;
      const image = product.images[0];
      const src = image?.thumbnail || image?.src;
      if (!src) continue;
      const key = imageKey(src);
      if (usedImages.has(key)) continue;
      usedProducts.add(product.id);
      usedImages.add(key);
      previews[id] = { src, alt: product.name };
      break;
    }
  });

  return previews;
}
