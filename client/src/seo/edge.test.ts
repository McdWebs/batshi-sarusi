import { beforeEach, describe, expect, it } from "vitest";
import { clearSeoCache, renderSeoPage, type SeoDeps } from "./edge";
import { category, departmentCategory, INDEX_HTML, prices, product } from "./testData";

const SITE = "https://batshi-home.co.il";

type Routes = Record<string, { status?: number; data?: unknown }>;

/** A fake storefront API: answers by path prefix, 404 for anything unknown. */
function fakeApi(routes: Routes, calls: string[] = []): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const path = url.replace("https://api.test", "");
    const key = Object.keys(routes).find((candidate) => path.startsWith(candidate));
    const hit = key ? routes[key] : undefined;
    if (!hit) return new Response(JSON.stringify({ success: false }), { status: 404 });
    if (hit.status && hit.status !== 200) return new Response("{}", { status: hit.status });
    return new Response(JSON.stringify({ success: true, data: hit.data }), { status: 200 });
  }) as typeof fetch;
}

const paginated = (items: unknown[], totalPages = 1) => ({ items, page: 1, perPage: 12, total: items.length, totalPages });

function deps(routes: Routes, calls: string[] = []): SeoDeps {
  return { indexHtml: async () => INDEX_HTML, apiBase: "https://api.test", siteUrl: SITE, fetchImpl: fakeApi(routes, calls) };
}

const req = (path: string, host = "batshi-home.co.il") => new Request(`https://${host}${path}`);

const categoryRoutes: Routes = { "/api/categories": { data: paginated([departmentCategory, category()]) } };

beforeEach(() => clearSeoCache());

describe("renderSeoPage", () => {
  it("serves a product page with its real title, canonical, structured data and text", async () => {
    const response = await renderSeoPage(
      req("/product/%D7%9E%D7%A2%D7%9E%D7%93-%D7%A2%D7%9D-6-%D7%9B%D7%A4%D7%99%D7%95%D7%AA-%D7%99%D7%94%D7%9C%D7%95%D7%9D/"),
      deps({ ...categoryRoutes, "/api/products/": { data: product() } }),
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title>מעמד עם 6 כפיות יהלום - batshi</title>");
    expect(html).toContain('<link rel="canonical" href="https://batshi-home.co.il/product/');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain("<h1>מעמד עם 6 כפיות יהלום</h1>");
    expect(html).toContain("49.00 ₪");
    expect(html).not.toContain("Batshi Sarusi");
    expect(response.headers.get("x-robots-tag")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("s-maxage");
  });

  it("answers 404 for a product that does not exist, and keeps it out of search", async () => {
    const response = await renderSeoPage(req("/product/gone/"), deps({ "/api/products/": { status: 404 } }));
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("noindex");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("falls back to the plain shell with a 200 when the shop cannot be reached", async () => {
    const response = await renderSeoPage(req("/product/x/"), deps({ "/api/products/": { status: 503 } }));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title>");
    expect(html).not.toContain('"@type":"Product"');
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=15");
  });

  it("lists a category's products with links and a link to the next page", async () => {
    const items = [product({ slug: "a-b", name: "פריט א" }), product({ id: 2, slug: "c-d", name: "פריט ב", prices: prices("13900") })];
    const calls: string[] = [];
    const response = await renderSeoPage(
      req("/product-category/%D7%91%D7%99%D7%A9%D7%95%D7%9C-%D7%9E%D7%98%D7%91%D7%97-%D7%95%D7%90%D7%A4%D7%99%D7%99%D7%94/%D7%90%D7%91%D7%99%D7%96%D7%A8%D7%99-%D7%9E%D7%98%D7%91%D7%97/"),
      deps({ ...categoryRoutes, "/api/products?": { data: paginated(items, 3) } }, calls),
    );
    const html = await response.text();
    expect(html).toContain("<title>אביזרי מטבח - batshi</title>");
    expect(html).toContain('<a href="/product/a-b">פריט א</a>');
    expect(html).toContain("?page=2");
    expect(calls.some((url) => url.includes("category=544") && url.includes("page=1"))).toBe(true);
  });

  it("gives page two its own title and canonical", async () => {
    const response = await renderSeoPage(
      req("/product-category/%D7%91%D7%99%D7%A9%D7%95%D7%9C-%D7%9E%D7%98%D7%91%D7%97-%D7%95%D7%90%D7%A4%D7%99%D7%99%D7%94/%D7%90%D7%91%D7%99%D7%96%D7%A8%D7%99-%D7%9E%D7%98%D7%91%D7%97/?page=2"),
      deps({ ...categoryRoutes, "/api/products?": { data: paginated([product()], 3) } }),
    );
    const html = await response.text();
    expect(html).toContain("<title>אביזרי מטבח - עמוד 2 - batshi</title>");
    expect(html).toMatch(/rel="canonical" href="[^"]*\?page=2"/);
  });

  it("keeps a category's tags when only its product list is slow", async () => {
    const response = await renderSeoPage(
      req("/product-category/%D7%91%D7%99%D7%A9%D7%95%D7%9C-%D7%9E%D7%98%D7%91%D7%97-%D7%95%D7%90%D7%A4%D7%99%D7%99%D7%94/%D7%90%D7%91%D7%99%D7%96%D7%A8%D7%99-%D7%9E%D7%98%D7%91%D7%97/"),
      deps({ ...categoryRoutes, "/api/products?": { status: 504 } }),
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<title>אביזרי מטבח - batshi</title>");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("<h1>אביזרי מטבח</h1>");
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=15");
  });

  it("has exactly one headline even when the shop's text has its own", async () => {
    const response = await renderSeoPage(
      req("/product/x/"),
      deps({ ...categoryRoutes, "/api/products/": { data: product({ description: "<h1>כותרת בתוך הטקסט</h1><p>טקסט</p>" }) } }),
    );
    expect((await response.text()).match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("answers 404 for an unknown category", async () => {
    const response = await renderSeoPage(req("/product-category/nothing/"), deps(categoryRoutes));
    expect(response.status).toBe(404);
  });

  it("marks utility pages noindex without calling the shop", async () => {
    const calls: string[] = [];
    const response = await renderSeoPage(req("/cart"), deps({}, calls));
    expect(await response.text()).toContain("noindex,follow");
    expect(calls).toHaveLength(0);
  });

  it("marks every page noindex on a host other than the real one", async () => {
    const response = await renderSeoPage(req("/", "batshi-sarusi.vercel.app"), deps({ ...categoryRoutes, "/api/products?": { data: paginated([]) } }));
    expect(await response.text()).toContain("noindex,follow");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("serves the home page with department links and a Website schema", async () => {
    const response = await renderSeoPage(req("/"), deps({ ...categoryRoutes, "/api/products?": { data: paginated([product()]) } }));
    const html = await response.text();
    expect(html).toContain("<title>בתשי הום - הכול לבית - batshi</title>");
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain("<h1>בתשי הום - הכול לבית</h1>");
  });

  it("serves the shop's own text for a content page, and a static one without calling the shop", async () => {
    const cms = await renderSeoPage(
      req("/%D7%93%D7%A3-%D7%97%D7%93%D7%A9/"),
      deps({ "/api/pages/": { data: { id: 1, slug: "דף-חדש", link: "", title: "דף חדש", contentHtml: "<p>על החנות</p>", excerptHtml: "" } } }),
    );
    expect(await cms.text()).toContain("<h1>דף חדש</h1>");

    const calls: string[] = [];
    const policy = await renderSeoPage(req("/%D7%9E%D7%93%D7%99%D7%A0%D7%99%D7%95%D7%AA-%D7%A4%D7%A8%D7%98%D7%99%D7%95%D7%AA/"), deps({}, calls));
    expect(await policy.text()).toContain("מדיניות פרטיות - batshi");
    expect(calls).toHaveLength(0);
  });

  it("answers 404 for a path the storefront does not have", async () => {
    const response = await renderSeoPage(req("/a/b/c/"), deps({}));
    expect(response.status).toBe(404);
  });
});
