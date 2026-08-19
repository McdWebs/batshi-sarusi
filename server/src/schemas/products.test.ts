import { describe, expect, it } from "vitest";
import { productListQuerySchema, searchQuerySchema } from "./products.js";

describe("product query schemas", () => {
  it("defaults pagination when query is empty", () => {
    expect(productListQuerySchema.parse({})).toMatchObject({ page: 1, perPage: 24 });
  });

  it("accepts observed Store API filters", () => {
    expect(
      productListQuerySchema.parse({
        page: "2",
        perPage: "10",
        category: "118",
        onSale: "true",
        type: "variable",
        orderby: "price",
        order: "asc",
      }),
    ).toMatchObject({
      page: 2,
      perPage: 10,
      category: 118,
      onSale: true,
      type: "variable",
      orderby: "price",
      order: "asc",
    });
  });

  it("requires search q", () => {
    expect(() => searchQuerySchema.parse({})).toThrow();
    expect(searchQuerySchema.parse({ q: "כוס" }).q).toBe("כוס");
  });
});
