import type { QueryClient } from "@tanstack/react-query";
import { getProduct, getProducts } from "../api/store";
import { decodeSlug } from "../utils/format";

const catalogDefaults = {
  page: 1,
  perPage: 12,
  orderby: "date" as const,
  order: "desc" as const,
};

export function prefetchProduct(queryClient: QueryClient, slug: string) {
  if (!slug) return;
  const idOrSlug = decodeSlug(slug);
  void queryClient.prefetchQuery({
    queryKey: ["product", idOrSlug],
    queryFn: () => getProduct(idOrSlug),
    staleTime: 60_000,
  });
}

export function prefetchCategoryCatalog(queryClient: QueryClient, categoryId: number) {
  const listQuery = { category: categoryId, ...catalogDefaults };
  void queryClient.prefetchQuery({
    queryKey: ["catalog", "", listQuery],
    queryFn: () => getProducts(listQuery),
    staleTime: 60_000,
  });
}
