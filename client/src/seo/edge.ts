import type { Brand, Category, CmsPage, Paginated, Product } from "../api/types";
import { getStaticPage } from "../content/staticPages";
import { categoryChildren, collections, departments } from "../storefront/map";
import { decodeSlug, findCategoryByPath } from "../utils/format";
import { cmsBody, directoryBody, headingBody, homeBody, listingBody, notFoundBody, productBody } from "./body";
import { PAGE_SIZE } from "./config";
import { applyToIndex, renderHeadTags } from "./html";
import {
  brandMeta,
  categoryMeta,
  categoryPath,
  categoryTrail,
  cmsMeta,
  contactMeta,
  directoryMeta,
  encodePath,
  genericMeta,
  homeMeta,
  notFoundMeta,
  productMeta,
  saleMeta,
  searchMeta,
  shopMeta,
  utilityMeta,
  type PageMeta,
} from "./meta";
import { classifyPath } from "./route";

export type SeoDeps = {
  /** The built `index.html`, as served by the static hosting. */
  indexHtml: () => Promise<string>;
  /** Base address of the storefront API (no trailing slash). */
  apiBase: string;
  /** The production address of the shop. Pages served from any other host are marked noindex. */
  siteUrl: string;
  /** Private key that lets these reads skip the API's per-address rate limit (sent as X-Edge-Key). */
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number };

const API_TIMEOUT_MS = 8000;
const TAXONOMY_TTL_MS = 5 * 60_000;

const memo = new Map<string, { at: number; value: Promise<unknown> }>();

/** Categories and brands change rarely; a warm edge instance keeps them for a few minutes. */
function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TAXONOMY_TTL_MS) return hit.value as Promise<T>;
  const value = load().catch((error) => {
    memo.delete(key);
    throw error;
  });
  memo.set(key, { at: Date.now(), value });
  return value;
}

export function clearSeoCache() {
  memo.clear();
}

async function callApi<T>(deps: SeoDeps, path: string): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await (deps.fetchImpl ?? fetch)(`${deps.apiBase}${path}`, {
      signal: controller.signal,
      headers: { accept: "application/json", ...(deps.apiKey ? { "x-edge-key": deps.apiKey } : {}) },
    });
    if (response.status === 404) return { ok: false, status: 404 };
    if (!response.ok) return { ok: false, status: response.status };
    const json = (await response.json()) as { success?: boolean; data?: T };
    if (json.success === false || json.data === undefined) return { ok: false, status: 502 };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function loadCategories(deps: SeoDeps): Promise<Category[] | null> {
  try {
    return await remember("categories", async () => {
      const result = await callApi<Paginated<Category>>(deps, "/api/categories?page=1&perPage=100&all=true");
      if (!result.ok) throw new Error("categories unavailable");
      return result.data.items;
    });
  } catch {
    return null;
  }
}

async function loadBrands(deps: SeoDeps): Promise<Brand[] | null> {
  try {
    return await remember("brands", async () => {
      const result = await callApi<Paginated<Brand>>(deps, "/api/brands?page=1&perPage=100");
      if (!result.ok) throw new Error("brands unavailable");
      return result.data.items;
    });
  } catch {
    return null;
  }
}

function productsQuery(params: Record<string, string | number | boolean>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
}

function pageNumber(url: URL): number {
  const page = Math.floor(Number(url.searchParams.get("page") || "1"));
  return Number.isFinite(page) && page >= 1 && page <= 1000 ? page : 1;
}

/** `degraded` marks a page whose tags are right but whose list of products could not be loaded in time. */
type Built = { meta: PageMeta; body: string; degraded?: boolean };
/** Null means the shop could not be reached, so the page falls back to the plain shell instead of a false 404. */
type Outcome = Built | null;

async function build(request: URL, deps: SeoDeps): Promise<Outcome> {
  const route = classifyPath(request.pathname);
  const origin = deps.siteUrl;
  const page = pageNumber(request);

  switch (route.kind) {
    case "home": {
      const [categories, deals] = await Promise.all([
        loadCategories(deps),
        callApi<Paginated<Product>>(deps, `/api/products?${productsQuery({ page: 1, perPage: 8, onSale: true, orderby: "date", order: "desc" })}`),
      ]);
      const all = categories ?? [];
      return { meta: homeMeta(origin), body: homeBody(departments(all), collections(all), deals.ok ? deals.data.items : []) };
    }
    case "shop":
    case "sale": {
      const onSale = route.kind === "sale";
      const result = await callApi<Paginated<Product>>(
        deps,
        `/api/products?${productsQuery({ page, perPage: PAGE_SIZE, orderby: "date", order: "desc", ...(onSale ? { onSale: true } : {}) })}`,
      );
      const meta = onSale ? saleMeta(page) : shopMeta(page);
      return {
        meta,
        degraded: !result.ok,
        body: listingBody({
          title: onSale ? "מבצעים" : "כל המוצרים",
          trail: [],
          products: result.ok ? result.data.items : [],
          basePath: onSale ? "/sale/" : "/shop/",
          page,
          totalPages: result.ok ? result.data.totalPages : 1,
        }),
      };
    }
    case "directory": {
      const all = await loadCategories(deps);
      if (!all) return null;
      const items = route.which === "departments" ? departments(all) : collections(all);
      return { meta: directoryMeta(route.which), body: directoryBody(route.which === "departments" ? "מחלקות" : "קולקציות", items) };
    }
    case "contact":
      return { meta: contactMeta(), body: headingBody("צור קשר") };
    case "search":
      return { meta: searchMeta(), body: "" };
    case "utility":
      return { meta: utilityMeta(route.name), body: "" };
    case "product": {
      const result = await callApi<Product>(deps, `/api/products/${encodeURIComponent(route.slug)}`);
      if (!result.ok) return result.status === 404 ? { meta: notFoundMeta("המוצר לא נמצא"), body: notFoundBody() } : null;
      const product = result.data;
      const all = await loadCategories(deps);
      const primary = all?.find((category) => category.id === product.categories[0]?.id);
      const trail = all && primary ? categoryTrail(all, primary) : [];
      return { meta: productMeta(product, origin, trail), body: productBody(product, trail) };
    }
    case "category": {
      const all = await loadCategories(deps);
      if (!all) return null;
      const category = findCategoryByPath(all, route.splat);
      if (!category) return { meta: notFoundMeta("הקטגוריה לא נמצאה"), body: notFoundBody() };
      const result = await callApi<Paginated<Product>>(
        deps,
        `/api/products?${productsQuery({ category: category.id, page, perPage: PAGE_SIZE, orderby: "date", order: "desc" })}`,
      );
      const trail = categoryTrail(all, category);
      return {
        meta: categoryMeta(category, origin, trail.slice(0, -1), page),
        degraded: !result.ok,
        body: listingBody({
          title: category.name,
          trail: trail.slice(0, -1),
          descriptionHtml: category.description,
          children: categoryChildren(all, category.id).slice(0, 24),
          products: result.ok ? result.data.items : [],
          basePath: categoryPath(category),
          page,
          totalPages: result.ok ? result.data.totalPages : 1,
        }),
      };
    }
    case "brand": {
      const brands = await loadBrands(deps);
      if (!brands) return null;
      const slug = decodeSlug(route.slug);
      const brand = brands.find((item) => decodeSlug(item.slug) === slug || decodeSlug(item.permalink).endsWith(`/${slug}`));
      if (!brand) return { meta: notFoundMeta("המותג לא נמצא"), body: notFoundBody() };
      const result = await callApi<Paginated<Product>>(
        deps,
        `/api/products?${productsQuery({ brand: brand.id, page, perPage: PAGE_SIZE, orderby: "date", order: "desc" })}`,
      );
      return {
        meta: brandMeta(brand, page),
        degraded: !result.ok,
        body: listingBody({
          title: brand.name,
          trail: [],
          descriptionHtml: brand.description,
          products: result.ok ? result.data.items : [],
          basePath: encodePath("brand", brand.slug),
          page,
          totalPages: result.ok ? result.data.totalPages : 1,
        }),
      };
    }
    case "cms": {
      const staticPage = getStaticPage(route.slug);
      if (staticPage) {
        return {
          meta: cmsMeta({ title: staticPage.title, excerptHtml: "", contentHtml: staticPage.html }, route.slug),
          body: cmsBody(staticPage.title, staticPage.html),
        };
      }
      const result = await callApi<CmsPage>(deps, `/api/pages/${encodeURIComponent(route.slug)}`);
      if (!result.ok) return result.status === 404 ? { meta: notFoundMeta(), body: notFoundBody() } : null;
      return { meta: cmsMeta(result.data, route.slug), body: cmsBody(result.data.title, result.data.contentHtml) };
    }
    case "unknown":
      return { meta: notFoundMeta(), body: notFoundBody() };
  }
}

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8", vary: "accept-encoding" };

/**
 * Answers a page request with the app shell plus this page's real title, description, canonical link,
 * structured data and plain-HTML content. Any failure falls back to the shell with generic tags, never to an error.
 */
export async function renderSeoPage(request: Request, deps: SeoDeps): Promise<Response> {
  const url = new URL(request.url);
  const indexHtml = await deps.indexHtml();
  const forceNoindex = new URL(deps.siteUrl).host !== url.host;

  let built: Outcome = null;
  try {
    built = await build(url, deps);
  } catch {
    built = null;
  }

  const reachable = built !== null;
  const { meta, body } = built ?? { meta: genericMeta(), body: "" };
  const status = reachable ? (meta.status ?? 200) : 200;
  const cache = !reachable || built?.degraded
    ? "public, max-age=0, s-maxage=15"
    : status === 200
      ? "public, max-age=0, s-maxage=300, stale-while-revalidate=86400"
      : "public, max-age=0, s-maxage=60";

  const html = applyToIndex(indexHtml, renderHeadTags(meta, deps.siteUrl, forceNoindex), body);
  const headers: Record<string, string> = { ...HTML_HEADERS, "cache-control": cache };
  if (forceNoindex || meta.noindex) headers["x-robots-tag"] = "noindex";
  return new Response(html, { status, headers });
}
