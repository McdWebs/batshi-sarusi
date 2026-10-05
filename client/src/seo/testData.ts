import type { Category, PricedAmount, Product } from "../api/types";

export function money(minor: string) {
  const padded = minor.padStart(3, "0");
  return { minor, major: `${padded.slice(0, -2)}.${padded.slice(-2)}` };
}

export function prices(price: string, extra: Partial<PricedAmount> = {}): PricedAmount {
  return {
    currencyCode: "ILS",
    currencySymbol: "₪",
    currencyMinorUnit: 2,
    currencyDecimalSeparator: ".",
    currencyThousandSeparator: ",",
    currencyPrefix: "",
    currencySuffix: " ₪",
    price: money(price),
    regularPrice: money(price),
    salePrice: money(price),
    priceRange: null,
    ...extra,
  };
}

export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 3253,
    name: "מעמד עם 6 כפיות יהלום",
    slug: "מעמד-עם-6-כפיות-יהלום",
    parent: 0,
    type: "variable",
    variation: "",
    permalink: "https://batshi-home.co.il/product/%d7%9e/",
    sku: "SP-6",
    shortDescription: "<p>מעמד מהודר לשש כפיות.</p>",
    description: "<p>מעמד מהודר לשש כפיות, בגימור זהב או כסף.</p>",
    onSale: false,
    prices: prices("4900"),
    averageRating: "0",
    reviewCount: 0,
    images: [{ id: 1, src: "https://batshi-home.co.il/wp-content/uploads/a.jpg", thumbnail: "", srcset: "", sizes: "", name: "", alt: "" }],
    categories: [{ id: 544, name: "אביזרי מטבח", slug: "אביזרי-מטבח", link: "https://batshi-home.co.il/product-category/a/b/" }],
    tags: [],
    brands: [],
    attributes: [],
    variations: [],
    groupedProducts: [],
    hasOptions: true,
    isPurchasable: true,
    isInStock: true,
    isOnBackorder: false,
    lowStockRemaining: null,
    stockAvailability: { text: "קיים במלאי", className: "in-stock" },
    soldIndividually: false,
    addToCart: { text: "בחירת אפשרות", singleText: "הוספה לסל", description: "", url: "", minimum: 1, maximum: 20, multipleOf: 1 },
    ...overrides,
  } as Product;
}

export function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 544,
    name: "אביזרי מטבח",
    slug: "אביזרי-מטבח",
    description: "",
    parent: 118,
    count: 842,
    image: null,
    permalink: "https://batshi-home.co.il/product-category/%d7%91%d7%99%d7%a9%d7%95%d7%9c-%d7%9e%d7%98%d7%91%d7%97-%d7%95%d7%90%d7%a4%d7%99%d7%99%d7%94/%d7%90%d7%91%d7%99%d7%96%d7%a8%d7%99-%d7%9e%d7%98%d7%91%d7%97/",
    ...overrides,
  };
}

export const departmentCategory = category({
  id: 118,
  name: "בישול, מטבח ואפייה",
  slug: "בישול-מטבח-ואפייה",
  parent: 0,
  count: 1400,
  permalink: "https://batshi-home.co.il/product-category/%d7%91%d7%99%d7%a9%d7%95%d7%9c-%d7%9e%d7%98%d7%91%d7%97-%d7%95%d7%90%d7%a4%d7%99%d7%99%d7%94/",
});

export const INDEX_HTML =
  '<!doctype html><html lang="he" dir="rtl"><head><meta charset="UTF-8" /><title>Batshi Sarusi</title>' +
  '<meta name="description" content="בית לאוהבי הבישול והאירוח" /></head><body><div id="root"></div></body></html>';
