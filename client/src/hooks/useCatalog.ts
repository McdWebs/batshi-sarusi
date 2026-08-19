import { useQuery } from "@tanstack/react-query";
import { getBrands, getCategories, getProducts, getProduct, searchProducts } from "../api/store";
import type { ProductQuery } from "../api/types";

export function useProductList(query: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: ["products", query],
    queryFn: () => getProducts(query),
    enabled,
  });
}

export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: () => getProduct(idOrSlug!),
    enabled: Boolean(idOrSlug),
  });
}

export function useSearch(q: string, query: ProductQuery = {}) {
  return useQuery({
    queryKey: ["search", q, query],
    queryFn: () => searchProducts(q, query),
    enabled: q.trim().length > 0,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const first = await getCategories(1, 100);
      if (first.totalPages <= 1) return first.items;
      const rest = await Promise.all(
        Array.from({ length: first.totalPages - 1 }, (_, index) => getCategories(index + 2, 100)),
      );
      return [...first.items, ...rest.flatMap((page) => page.items)];
    },
    staleTime: 5 * 60_000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => getBrands(),
    staleTime: 5 * 60_000,
  });
}
