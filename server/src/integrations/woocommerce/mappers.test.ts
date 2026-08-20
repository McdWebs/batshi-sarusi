import { describe, expect, it } from "vitest";
import { mapCart, mapCartItemTotals, mapProduct } from "./mappers.js";

describe("mapProduct", () => {
  it("normalizes an observed Store API product without inventing related products", () => {
    const product = mapProduct({
      id: 36870,
      name: "מגש ציפוי כסף קוטר 24",
      slug: "מגש-ציפוי-כסף-קוטר-24-חדש-קולקציה-2027",
      parent: 0,
      type: "simple",
      permalink: "https://batshi-home.co.il/product/example/",
      sku: "X6067",
      short_description: "",
      description: "",
      on_sale: true,
      prices: {
        price: "5900",
        regular_price: "69900",
        sale_price: "5900",
        price_range: null,
        currency_code: "ILS",
        currency_symbol: "₪",
        currency_minor_unit: 2,
      },
      images: [{ id: 1, src: "https://batshi-home.co.il/image.jpg", alt: "" }],
      categories: [{ id: 118, name: "בישול, מטבח ואפייה", slug: "%d7%91%d7%99%d7%a9%d7%95%d7%9c" }],
      tags: [],
      brands: [],
      attributes: [],
      variations: [],
      grouped_products: [],
      has_options: false,
      is_purchasable: true,
      is_in_stock: true,
      is_on_backorder: false,
      low_stock_remaining: null,
      stock_availability: { text: "קיים במלאי", class: "in-stock" },
      sold_individually: false,
      add_to_cart: { text: "הוספה לסל", minimum: 1, maximum: 12, multiple_of: 1 },
    });

    expect(product.categories[0]?.slug).toBe("בישול");
    expect(product.onSale).toBe(true);
    expect(product.isInStock).toBe(true);
    expect(product.prices?.price).toEqual({ minor: "5900", major: "59.00" });
    expect(product.stockAvailability.text).toBe("קיים במלאי");
    expect(product).not.toHaveProperty("related");
    expect(product).not.toHaveProperty("upsells");
  });
});

describe("mapCartItemTotals", () => {
  it("maps Woo line_* totals instead of cart-level total_* keys", () => {
    const totals = mapCartItemTotals({
      currency_code: "ILS",
      currency_symbol: "₪",
      currency_minor_unit: 2,
      line_subtotal: "39800",
      line_subtotal_tax: "0",
      line_total: "39800",
      line_total_tax: "0",
    });

    expect(totals.totalPrice).toEqual({ minor: "39800", major: "398.00" });
    expect(totals.lineTotal).toEqual({ minor: "39800", major: "398.00" });
  });
});

describe("mapCart", () => {
  it("maps cart item line totals onto totalPrice", () => {
    const cart = mapCart({
      items: [
        {
          key: "abc",
          id: 1,
          quantity: 2,
          name: "Test",
          prices: {
            price: "19900",
            regular_price: "59900",
            sale_price: "19900",
            currency_code: "ILS",
            currency_symbol: "₪",
            currency_minor_unit: 2,
          },
          totals: {
            currency_code: "ILS",
            currency_symbol: "₪",
            currency_minor_unit: 2,
            line_subtotal: "39800",
            line_total: "39800",
            line_subtotal_tax: "0",
            line_total_tax: "0",
          },
          images: [],
          variation: [],
        },
      ],
      items_count: 2,
      coupons: [],
      fees: [],
      totals: {
        currency_code: "ILS",
        currency_symbol: "₪",
        currency_minor_unit: 2,
        total_items: "39800",
        total_price: "39800",
        total_discount: "0",
        total_tax: "0",
      },
      shipping_address: {},
      billing_address: {},
      needs_payment: true,
      needs_shipping: true,
      has_calculated_shipping: false,
      shipping_rates: [],
      errors: [],
    });

    expect(cart.items[0]?.totals.totalPrice.major).toBe("398.00");
  });
});
