import { describe, expect, it } from "vitest";
import { applyToIndex, renderHeadTags, safeJson } from "./html";
import { categoryMeta, categoryPath, categoryTrail, encodePath, priceText, productMeta, utilityMeta } from "./meta";
import { classifyPath } from "./route";
import { isSitemapPath, rewriteSitemap, shopSitemapPath } from "./sitemap";
import { sanitizeHtml, stripHtml, truncate } from "./text";
import { category, departmentCategory, INDEX_HTML, money, prices, product } from "./testData";

const ORIGIN = "https://batshi-home.co.il";

describe("classifyPath", () => {
  it("sorts every page the storefront has", () => {
    expect(classifyPath("/")).toEqual({ kind: "home" });
    expect(classifyPath("/shop/")).toEqual({ kind: "shop" });
    expect(classifyPath("/sale")).toEqual({ kind: "sale" });
    expect(classifyPath("/departments")).toEqual({ kind: "directory", which: "departments" });
    expect(classifyPath("/product/%D7%9E%D7%A2%D7%9E%D7%93/")).toEqual({ kind: "product", slug: "מעמד" });
    expect(classifyPath("/product-category/a/%D7%91/")).toEqual({ kind: "category", splat: "a/ב" });
    expect(classifyPath("/brand/benetton")).toEqual({ kind: "brand", slug: "benetton" });
    expect(classifyPath("/%D7%A6%D7%95%D7%A8-%D7%A7%D7%A9%D7%A8")).toEqual({ kind: "contact" });
    expect(classifyPath("/מדיניות-פרטיות/")).toEqual({ kind: "cms", slug: "מדיניות-פרטיות" });
  });

  it("marks carts, accounts and the owner's tools as utility pages", () => {
    for (const path of ["/cart", "/checkout/", "/my-account", "/studio", "/analytics", "/demand", "/influencers/talia"]) {
      expect(classifyPath(path).kind).toBe("utility");
    }
  });

  it("does not invent pages", () => {
    expect(classifyPath("/a/b/c")).toEqual({ kind: "unknown" });
    expect(classifyPath("/product/a/b")).toEqual({ kind: "unknown" });
  });
});

describe("text helpers", () => {
  it("turns shop HTML into plain text", () => {
    expect(stripHtml("<p>שלום&nbsp;<b>עולם</b></p><script>x()</script><p>עוד &#8211; שורה</p>")).toBe("שלום עולם עוד – שורה");
  });

  it("cuts long text at a word", () => {
    const text = "מילה ".repeat(60).trim();
    const cut = truncate(text, 50);
    expect(cut.length).toBeLessThanOrEqual(50);
    expect(cut.endsWith("…")).toBe(true);
    expect(truncate("קצר", 50)).toBe("קצר");
  });

  it("removes anything executable from shop HTML", () => {
    const dirty = '<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><iframe src="x"></iframe>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/script|onclick|javascript:|iframe/i);
    expect(clean).toContain("hi");
  });
});

describe("page metadata", () => {
  it("encodes paths the way the old site wrote them", () => {
    expect(encodePath("product", "מעמד-עם")).toBe("/product/%D7%9E%D7%A2%D7%9E%D7%93-%D7%A2%D7%9D/");
    expect(encodePath()).toBe("/");
  });

  it("builds a product page's title, description, canonical path and offer", () => {
    const meta = productMeta(product(), ORIGIN);
    expect(meta.title).toBe("מעמד עם 6 כפיות יהלום - batshi");
    expect(meta.description).toBe("מעמד מהודר לשש כפיות.");
    expect(meta.path).toBe("/product/%D7%9E%D7%A2%D7%9E%D7%93-%D7%A2%D7%9D-6-%D7%9B%D7%A4%D7%99%D7%95%D7%AA-%D7%99%D7%94%D7%9C%D7%95%D7%9D/");
    expect(meta.image).toContain("a.jpg");
    const ld = meta.jsonLd?.[0] as Record<string, any>;
    expect(ld["@type"]).toBe("Product");
    expect(ld.sku).toBe("SP-6");
    expect(ld.offers).toMatchObject({ "@type": "Offer", price: "49.00", priceCurrency: "ILS", availability: "https://schema.org/InStock" });
  });

  it("uses a low and a high price when the options cost different amounts", () => {
    const ranged = product({ prices: prices("13900", { priceRange: { minAmount: money("13900"), maxAmount: money("18900") } }) });
    const ld = productMeta(ranged, ORIGIN).jsonLd?.[0] as Record<string, any>;
    expect(ld.offers).toMatchObject({ "@type": "AggregateOffer", lowPrice: "139.00", highPrice: "189.00" });
    expect(priceText(ranged.prices)).toBe("139.00 ₪ – 189.00 ₪");
  });

  it("gives no offer to a product without a price, and marks stock out", () => {
    const free = product({ prices: prices("0"), isInStock: false });
    const ld = productMeta(free, ORIGIN).jsonLd?.[0] as Record<string, any>;
    expect(ld.offers).toBeUndefined();
    expect(priceText(free.prices)).toBeNull();
    const soldOut = productMeta(product({ isInStock: false }), ORIGIN).jsonLd?.[0] as Record<string, any>;
    expect(soldOut.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("falls back to a description built from the name and price", () => {
    const meta = productMeta(product({ shortDescription: "", description: "" }), ORIGIN);
    expect(meta.description).toContain("מעמד עם 6 כפיות יהלום");
    expect(meta.description).toContain("49.00 ₪");
  });

  it("adds a breadcrumb list when it knows the category trail", () => {
    const all = [departmentCategory, category()];
    const trail = categoryTrail(all, category());
    const meta = productMeta(product(), ORIGIN, trail);
    const crumbs = meta.jsonLd?.[1] as Record<string, any>;
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    expect(crumbs.itemListElement.map((item: any) => item.name)).toEqual(["בית", "בישול, מטבח ואפייה", "אביזרי מטבח", "מעמד עם 6 כפיות יהלום"]);
  });

  it("keeps category pages on their old addresses and gives later pages their own", () => {
    const first = categoryMeta(category(), ORIGIN, [], 1);
    const second = categoryMeta(category(), ORIGIN, [], 2);
    expect(first.title).toBe("אביזרי מטבח - batshi");
    expect(first.path).toBe(categoryPath(category()));
    expect(decodeURIComponent(first.path ?? "")).toBe("/product-category/בישול-מטבח-ואפייה/אביזרי-מטבח/");
    expect(second.title).toBe("אביזרי מטבח - עמוד 2 - batshi");
    expect(second.path).toBe(`${first.path}?page=2`);
  });

  it("marks utility pages noindex", () => {
    expect(utilityMeta("cart").noindex).toBe(true);
  });
});

describe("HTML output", () => {
  it("cannot be broken out of by data in a script tag", () => {
    const json = safeJson({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).name).toBe("</script><script>alert(1)</script>");
  });

  it("writes a complete head, escaping text", () => {
    const meta = productMeta(product({ name: 'כוס "יוקרה" & קנקן' }), ORIGIN);
    const tags = renderHeadTags(meta, ORIGIN);
    expect(tags).toContain("<title>כוס &quot;יוקרה&quot; &amp; קנקן - batshi</title>");
    expect(tags).toContain('rel="canonical"');
    expect(tags).toContain('property="og:image"');
    expect(tags).toContain('application/ld+json');
    expect(tags).not.toContain('content="noindex');
  });

  it("adds noindex for utility pages and for copies on other hosts", () => {
    expect(renderHeadTags(utilityMeta("cart"), ORIGIN)).toContain("noindex,follow");
    expect(renderHeadTags(productMeta(product(), ORIGIN), ORIGIN, true)).toContain("noindex,follow");
  });

  it("replaces the shell's own title and description and fills the root", () => {
    const html = applyToIndex(INDEX_HTML, renderHeadTags(productMeta(product(), ORIGIN), ORIGIN), "<main>גוף</main>");
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).not.toContain("Batshi Sarusi");
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).toContain('<div id="root"><main>גוף</main></div>');
  });
});

describe("sitemaps", () => {
  it("recognises the addresses Yoast uses", () => {
    for (const path of ["/sitemap_index.xml", "/sitemap.xml", "/product-sitemap.xml", "/product-sitemap3.xml", "/product_cat-sitemap.xml", "/page-sitemap.xml"]) {
      expect(isSitemapPath(path)).toBe(true);
    }
    expect(isSitemapPath("/robots.txt")).toBe(false);
    expect(isSitemapPath("/product/x.xml")).toBe(false);
    expect(shopSitemapPath("/sitemap.xml")).toBe("/sitemap_index.xml");
  });

  it("points every link at the storefront and drops the plugin stylesheet", () => {
    const xml = '<?xml version="1.0"?><?xml-stylesheet type="text/xsl" href="//shop.example/wp-content/x.xsl"?><urlset><url><loc>https://shop.example/product/a/</loc></url></urlset>';
    const out = rewriteSitemap(xml, "https://shop.example", "https://www.example.com");
    expect(out).toContain("<loc>https://www.example.com/product/a/</loc>");
    expect(out).not.toContain("xml-stylesheet");
    expect(out).not.toContain("shop.example");
  });
});
