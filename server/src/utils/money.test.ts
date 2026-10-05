import { describe, expect, it } from "vitest";
import { hasPrice, minorToMajor, repairPrices, toMoney, toPricedAmount } from "./money.js";

describe("minorToMajor", () => {
  it("converts ILS minor units observed from Store API", () => {
    expect(minorToMajor("5900", 2)).toBe("59.00");
    expect(minorToMajor("19900", 2)).toBe("199.00");
    expect(minorToMajor("129900", 2)).toBe("1299.00");
    expect(minorToMajor("0", 2)).toBe("0.00");
    expect(minorToMajor("39", 2)).toBe("0.39");
  });
});

describe("toPricedAmount", () => {
  it("keeps Store API minor strings and adds major at the boundary", () => {
    const priced = toPricedAmount({
      price: "5900",
      regular_price: "69900",
      sale_price: "5900",
      price_range: null,
      currency_code: "ILS",
      currency_symbol: "₪",
      currency_minor_unit: 2,
      currency_decimal_separator: ".",
      currency_thousand_separator: ",",
      currency_prefix: "",
      currency_suffix: " ₪",
    });
    expect(priced).toMatchObject({
      currencyCode: "ILS",
      currencyMinorUnit: 2,
      price: { minor: "5900", major: "59.00" },
      regularPrice: { minor: "69900", major: "699.00" },
      salePrice: { minor: "5900", major: "59.00" },
      priceRange: null,
    });
  });

  it("preserves toMoney minor as given", () => {
    expect(toMoney("3900", 2)).toEqual({ minor: "3900", major: "39.00" });
  });
});

describe("repairPrices", () => {
  const format = { currency_code: "ILS", currency_symbol: "₪", currency_minor_unit: 2, currency_suffix: " ₪" };
  const build = (input: Parameters<typeof toPricedAmount>[0]) => repairPrices(toPricedAmount({ ...format, ...input }));

  it("fills a zero price from the regular price when the variations all cost the same", () => {
    const fixed = build({ price: "0", regular_price: "4900", sale_price: "4900", price_range: null });
    expect(fixed?.price).toEqual({ minor: "4900", major: "49.00" });
  });

  it("fills a zero price from the lowest end of the range", () => {
    const fixed = build({ price: "0", regular_price: "69900", sale_price: "13900", price_range: { min_amount: "13900", max_amount: "18900" } });
    expect(fixed?.price.minor).toBe("13900");
    expect(fixed?.priceRange?.maxAmount.minor).toBe("18900");
  });

  it("prefers the sale price over the regular price", () => {
    const fixed = build({ price: "0", regular_price: "149900", sale_price: "29900", price_range: null });
    expect(fixed?.price.minor).toBe("29900");
  });

  it("keeps a real price and drops a range whose ends are equal", () => {
    const fixed = build({ price: "9900", regular_price: "9900", sale_price: "9900", price_range: { min_amount: "9900", max_amount: "9900" } });
    expect(fixed?.price.minor).toBe("9900");
    expect(fixed?.priceRange).toBeNull();
  });

  it("leaves a product with no price anywhere at zero", () => {
    const fixed = build({ price: "0", regular_price: "0", sale_price: "0", price_range: null });
    expect(fixed?.price.minor).toBe("0");
    expect(fixed && hasPrice(fixed)).toBe(false);
  });
});
