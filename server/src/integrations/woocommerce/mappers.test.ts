import { describe, expect, it } from "vitest";
import { mapProduct } from "./mappers.js";

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
