import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBrands, getCategories, getProducts, getProduct, searchProducts } from "../api/store";
import type { ProductQuery } from "../api/types";

export function useProductList(query: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: ["products", query],
    queryFn: () => getProducts(query),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: () => getProduct(idOrSlug!),
    enabled: Boolean(idOrSlug),
    staleTime: 60_000,
  });
}

export function useSearch(q: string, query: ProductQuery = {}) {
  return useQuery({
    queryKey: ["search", q, query],
    queryFn: () => searchProducts(q, query),
    enabled: q.trim().length > 0,
    staleTime: 60_000,
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const page = await getCategories(1, 100, true);
      return page.items;
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
