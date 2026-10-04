import type { QueryClient } from "@tanstack/react-query";
import { getProduct, getProducts } from "../api/store";
import { decodeSlug } from "../utils/format";
import { optimizeImage } from "../utils/imageProxy";

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

const preloaded = new Set<string>();

/** Starts downloading a photo before it is needed, once per URL. Pass the srcset and sizes the real <img> will use. */
export function preloadImage(src: string, srcset?: string, sizes?: string) {
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  // Same transform as StoreImage, so the browser fetches exactly the file the page will ask for.
  const optimized = optimizeImage(src, srcset);
  const image = new Image();
  image.referrerPolicy = "no-referrer";
  const finalSrcset = optimized?.srcSet ?? srcset;
  if (finalSrcset) image.srcset = finalSrcset;
  if (sizes) image.sizes = sizes;
  image.src = optimized?.src ?? src;
}

export function prefetchCategoryCatalog(queryClient: QueryClient, categoryId: number) {
  const listQuery = { category: categoryId, ...catalogDefaults };
  void queryClient.prefetchQuery({
    queryKey: ["catalog", "", listQuery],
    queryFn: () => getProducts(listQuery),
    staleTime: 60_000,
  });
}
