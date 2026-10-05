import { listProducts, type ProductListQuery } from "../integrations/woocommerce/products.js";
import { mapProduct } from "../integrations/woocommerce/mappers.js";
import type { WooProduct } from "../integrations/woocommerce/types.js";
import type { Paginated, Product } from "../types/api.js";
import { repairPrices, toPricedAmount } from "../utils/money.js";
import { cacheKey, cached } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

/**
 * WooCommerce sorts by its own stored price, which is 0 for 19 products that have options (and for 11 with no
 * price at all). Those always came out first, and a 5 shekel bottle came out last. This sorts by the price the
 * storefront actually shows (`repairPrices`) instead: an in-memory list of every product's price, rebuilt every
 * 30 minutes, is sorted and paged here, and only the 12 products on the page are fetched from the shop.
 *
 * Products with no price anywhere in the shop go last, whichever direction is chosen.
 */

export type PriceEntry = {
  id: number;
  /** Price in minor units (agorot). Zero or less means the shop has no price for it. */
  price: number;
  categories: number[];
  brands: number[];
  onSale: boolean;
  inStock: boolean;
};

export type PriceFilter = {
  /** The category and all its sub-categories. */
  categoryIds?: Set<number>;
  brand?: number;
  onSale?: boolean;
  /** "instock" or "outofstock". */
  stockStatus?: "instock" | "outofstock";
};

const INDEX_TTL_MS = 30 * 60_000;
const INDEX_PAGE_SIZE = 100;
const INDEX_CONCURRENCY = 3;
const SEARCH_POOL_PAGES = 5;
const SEARCH_POOL_TTL_MS = 5 * 60_000;

export function toEntry(raw: WooProduct): PriceEntry {
  const prices = repairPrices(toPricedAmount(raw.prices));
  return {
    id: raw.id,
    price: Number(prices?.price.minor ?? 0) || 0,
    categories: (raw.categories ?? []).map((term) => term.id ?? 0),
    brands: (raw.brands ?? []).map((term) => term.id ?? 0),
    onSale: Boolean(raw.on_sale),
    inStock: Boolean(raw.is_in_stock),
  };
}

export function filterEntries(entries: PriceEntry[], filter: PriceFilter): PriceEntry[] {
  return entries.filter(
    (entry) =>
      (!filter.categoryIds || entry.categories.some((id) => filter.categoryIds?.has(id))) &&
      (filter.brand === undefined || entry.brands.includes(filter.brand)) &&
      (filter.onSale === undefined || entry.onSale === filter.onSale) &&
      (filter.stockStatus === undefined || entry.inStock === (filter.stockStatus === "instock")),
  );
}

/** Product ids in price order. Ties keep the newer product (higher id) first; unpriced products go last. */
export function sortIdsByPrice(entries: PriceEntry[], order: "asc" | "desc"): number[] {
  const priced = entries.filter((entry) => entry.price > 0);
  const unpriced = entries.filter((entry) => entry.price <= 0);
  const direction = order === "desc" ? -1 : 1;
  priced.sort((a, b) => (a.price - b.price) * direction || b.id - a.id);
  unpriced.sort((a, b) => b.id - a.id);
  return [...priced, ...unpriced].map((entry) => entry.id);
}

/** All ids in a category's subtree, from the flat category list. */
export function subtreeIds(categories: Array<{ id: number; parent: number }>, rootId: number): Set<number> {
  const ids = new Set<number>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (!ids.has(category.id) && ids.has(category.parent)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}

let index: { entries: PriceEntry[]; builtAt: number } | null = null;
let building: Promise<void> | null = null;

async function buildIndex(): Promise<void> {
  const first = await listProducts({ page: 1, perPage: INDEX_PAGE_SIZE });
  const raws: WooProduct[] = [...(first.data ?? [])];
  const pages = Array.from({ length: Math.max(0, (first.totalPages ?? 1) - 1) }, (_, i) => i + 2);
  const queue = [...pages];
  await Promise.all(
    Array.from({ length: INDEX_CONCURRENCY }, async () => {
      for (let page = queue.shift(); page !== undefined; page = queue.shift()) {
        const result = await listProducts({ page, perPage: INDEX_PAGE_SIZE });
        raws.push(...(result.data ?? []));
      }
    }),
  );
  index = { entries: raws.map(toEntry), builtAt: Date.now() };
  logger.info({ products: raws.length }, "price index built");
}

/** Starts a rebuild unless one is running. A failed rebuild keeps the previous list and is retried on the next request. */
export function refreshPriceIndex(): Promise<void> {
  if (!building) {
    building = buildIndex()
      .catch((error) => logger.warn({ err: error instanceof Error ? error.message : String(error) }, "price index build failed"))
      .finally(() => {
        building = null;
      });
  }
  return building;
}

/** The current list, or null while the first one is still being built (callers then use the shop's own order). */
export function currentPriceIndex(): PriceEntry[] | null {
  if (!index || Date.now() - index.builtAt > INDEX_TTL_MS) void refreshPriceIndex();
  return index?.entries ?? null;
}

export function resetPriceIndex() {
  index = null;
  building = null;
}

/** For tests. */
export function setPriceIndex(entries: PriceEntry[]) {
  index = { entries, builtAt: Date.now() };
}

async function searchPool(query: ProductListQuery): Promise<PriceEntry[]> {
  return cached(cacheKey(["pricepool", query.search, query.category, query.brand, query.onSale, query.stockStatus]), SEARCH_POOL_TTL_MS, async () => {
    const raws: WooProduct[] = [];
    for (let page = 1; page <= SEARCH_POOL_PAGES; page += 1) {
      const result = await listProducts({ ...query, page, perPage: INDEX_PAGE_SIZE, orderby: undefined, order: undefined });
      raws.push(...(result.data ?? []));
      if (page >= (result.totalPages ?? 1)) break;
    }
    return raws.map(toEntry);
  });
}

/**
 * One page of products in true price order, or null when this request cannot be answered that way (the caller
 * then uses the shop's own order). Handles category, brand, on-sale and search filters, which are all the
 * storefront uses with price sorting.
 */
export async function priceSortedPage(query: ProductListQuery): Promise<Paginated<Product> | null> {
  if (query.orderby !== "price") return null;
  if (query.type || query.featured !== undefined || query.stockStatus === "onbackorder") return null;

  const page = query.page ?? 1;
  const perPage = query.perPage ?? 24;
  let pool: PriceEntry[];

  if (query.search) {
    pool = await searchPool(query);
  } else {
    const all = currentPriceIndex();
    if (!all) return null;
    let categoryIds: Set<number> | undefined;
    if (query.category) {
      const { getAllCategories } = await import("./categoryService.js");
      categoryIds = subtreeIds(await getAllCategories(), query.category);
    }
    pool = filterEntries(all, {
      categoryIds,
      brand: query.brand,
      onSale: query.onSale,
      stockStatus: query.stockStatus === "instock" || query.stockStatus === "outofstock" ? query.stockStatus : undefined,
    });
  }

  const ids = sortIdsByPrice(pool, query.order === "desc" ? "desc" : "asc");
  const pageIds = ids.slice((page - 1) * perPage, page * perPage);
  const total = ids.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (!pageIds.length) return { items: [], page, perPage, total, totalPages };

  const result = await listProducts({ include: pageIds, perPage: pageIds.length });
  const byId = new Map((result.data ?? []).map((raw) => [raw.id, raw]));
  const items = pageIds.map((id) => byId.get(id)).filter((raw): raw is WooProduct => Boolean(raw)).map(mapProduct);
  return { items, page, perPage, total, totalPages };
}
