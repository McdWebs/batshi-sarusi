import { describe, expect, it } from "vitest";
import { minorToMajor, toMoney, toPricedAmount } from "./money.js";

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
