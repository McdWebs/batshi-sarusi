import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WooProduct } from "../integrations/woocommerce/types.js";

const listProducts = vi.fn();
vi.mock("../integrations/woocommerce/products.js", () => ({ listProducts: (query: unknown) => listProducts(query) }));
vi.mock("./categoryService.js", () => ({
  getAllCategories: async () => [
    { id: 10, parent: 0 },
    { id: 11, parent: 10 },
    { id: 12, parent: 11 },
    { id: 20, parent: 0 },
  ],
}));

import { clearCache } from "../utils/cache.js";
import { filterEntries, priceSortedPage, setPriceIndex, resetPriceIndex, sortIdsByPrice, subtreeIds, toEntry, type PriceEntry } from "./priceSort.js";

const format = { currency_code: "ILS", currency_symbol: "₪", currency_minor_unit: 2, currency_suffix: " ₪" };
function raw(id: number, prices: Partial<NonNullable<WooProduct["prices"]>>, extra: Partial<WooProduct> = {}): WooProduct {
  return { id, name: `p${id}`, slug: `p${id}`, type: "simple", prices: { ...format, price: "0", regular_price: "0", sale_price: "0", price_range: null, ...prices }, categories: [], brands: [], ...extra } as WooProduct;
}
const entry = (id: number, price: number, extra: Partial<PriceEntry> = {}): PriceEntry => ({ id, price, categories: [], brands: [], onSale: false, inStock: true, ...extra });

beforeEach(() => {
  listProducts.mockReset();
  resetPriceIndex();
  clearCache();
});

describe("toEntry", () => {
  it("uses the price the storefront shows, not the shop's stored zero", () => {
    expect(toEntry(raw(1, { price: "0", regular_price: "4900", sale_price: "4900" })).price).toBe(4900);
    expect(toEntry(raw(2, { price: "0", sale_price: "500", regular_price: "7900" })).price).toBe(500);
    expect(toEntry(raw(3, { price: "13900", regular_price: "69900", sale_price: "13900", price_range: { min_amount: "13900", max_amount: "18900" } })).price).toBe(13900);
    expect(toEntry(raw(4, {})).price).toBe(0);
  });
});

describe("sortIdsByPrice", () => {
  const entries = [entry(1, 4900), entry(2, 0), entry(3, 500), entry(4, 19900), entry(5, 4900), entry(6, 0)];

  it("orders low to high with unpriced products last", () => {
    expect(sortIdsByPrice(entries, "asc")).toEqual([3, 5, 1, 4, 6, 2]);
  });

  it("orders high to low and still puts unpriced products last", () => {
    expect(sortIdsByPrice(entries, "desc")).toEqual([4, 5, 1, 3, 6, 2]);
  });
});

describe("filters", () => {
  it("finds a category's whole subtree", () => {
    const categories = [{ id: 10, parent: 0 }, { id: 11, parent: 10 }, { id: 12, parent: 11 }, { id: 20, parent: 0 }];
    expect([...subtreeIds(categories, 10)].sort()).toEqual([10, 11, 12]);
    expect([...subtreeIds(categories, 20)]).toEqual([20]);
  });

  it("filters by stock", () => {
    const entries = [entry(1, 1), entry(2, 1, { inStock: false }), entry(3, 1)];
    expect(filterEntries(entries, { stockStatus: "instock" }).map((e) => e.id)).toEqual([1, 3]);
    expect(filterEntries(entries, { stockStatus: "outofstock" }).map((e) => e.id)).toEqual([2]);
  });

  it("filters by category, brand and sale", () => {
    const entries = [entry(1, 1, { categories: [12], brands: [7], onSale: true }), entry(2, 1, { categories: [20] }), entry(3, 1, { categories: [11], onSale: true })];
    expect(filterEntries(entries, { categoryIds: new Set([10, 11, 12]) }).map((e) => e.id)).toEqual([1, 3]);
    expect(filterEntries(entries, { brand: 7 }).map((e) => e.id)).toEqual([1]);
    expect(filterEntries(entries, { onSale: true }).map((e) => e.id)).toEqual([1, 3]);
  });
});

describe("priceSortedPage", () => {
  const index = [entry(1, 4900, { categories: [11] }), entry(2, 500, { categories: [12] }), entry(3, 0, { categories: [11] }), entry(4, 19900, { categories: [20] }), entry(5, 100, { categories: [11] })];
  const serveInclude = () =>
    listProducts.mockImplementation(async (query: { include?: number[] }) => ({
      data: [...(query.include ?? [])].reverse().map((id) => raw(id, { price: String(index.find((e) => e.id === id)?.price ?? 0) })),
    }));

  it("is not used for other sort orders or before the list is built", async () => {
    expect(await priceSortedPage({ orderby: "date", page: 1, perPage: 12 })).toBeNull();
    expect(await priceSortedPage({ orderby: "price", order: "asc", page: 1, perPage: 12 })).toBeNull();
  });

  it("is not used for filters it does not know", async () => {
    setPriceIndex(index);
    expect(await priceSortedPage({ orderby: "price", stockStatus: "onbackorder" })).toBeNull();
    expect(await priceSortedPage({ orderby: "price", type: "variable" })).toBeNull();
  });

  it("returns a page in true price order, whatever order the shop answers in", async () => {
    setPriceIndex(index);
    serveInclude();
    const result = await priceSortedPage({ orderby: "price", order: "asc", page: 1, perPage: 3 });
    expect(result?.items.map((item) => item.id)).toEqual([5, 2, 1]);
    expect(result).toMatchObject({ page: 1, perPage: 3, total: 5, totalPages: 2 });
    const second = await priceSortedPage({ orderby: "price", order: "asc", page: 2, perPage: 3 });
    expect(second?.items.map((item) => item.id)).toEqual([4, 3]);
  });

  it("sorts high to low and limits to a category and its sub-categories", async () => {
    setPriceIndex(index);
    serveInclude();
    const result = await priceSortedPage({ orderby: "price", order: "desc", category: 10, page: 1, perPage: 12 });
    expect(result?.items.map((item) => item.id)).toEqual([1, 2, 5, 3]);
    expect(result?.total).toBe(4);
  });

  it("lists only products in stock when asked, in price order", async () => {
    setPriceIndex([entry(1, 300), entry(2, 100, { inStock: false }), entry(3, 200), entry(4, 50, { inStock: false })]);
    listProducts.mockImplementation(async (query: { include?: number[] }) => ({ data: (query.include ?? []).map((id) => raw(id, { price: "100" })) }));
    const result = await priceSortedPage({ orderby: "price", order: "asc", stockStatus: "instock", page: 1, perPage: 12 });
    expect(result?.items.map((item) => item.id)).toEqual([3, 1]);
    expect(result?.total).toBe(2);
  });

  it("answers an empty page past the end without asking the shop", async () => {
    setPriceIndex(index);
    const result = await priceSortedPage({ orderby: "price", order: "asc", page: 9, perPage: 12 });
    expect(result?.items).toEqual([]);
    expect(listProducts).not.toHaveBeenCalled();
  });

  it("sorts search results by fetching the matches", async () => {
    listProducts.mockImplementation(async (query: { include?: number[]; search?: string }) =>
      query.include
        ? { data: query.include.map((id) => raw(id, { price: id === 2 ? "100" : "900" })) }
        : { data: [raw(1, { price: "900" }), raw(2, { price: "100" })], totalPages: 1 },
    );
    const result = await priceSortedPage({ orderby: "price", order: "asc", search: "כוס", page: 1, perPage: 12 });
    expect(result?.items.map((item) => item.id)).toEqual([2, 1]);
  });
});
