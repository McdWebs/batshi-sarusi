/**
 * Vercel Routing Middleware: runs at the edge before the static storefront is served.
 *
 *  - Page requests get the app shell with the page's real title, description, canonical link, structured data
 *    and plain-HTML content (see client/src/seo), so search engines read them without running any script.
 *  - Sitemap requests are answered from the shop's own sitemap files, at the same addresses Google already knows.
 *
 * Any problem falls through to the normal single-page app (the rewrite in vercel.json), exactly as before.
 *
 * Environment (Vercel project settings):
 *   API_BASE_URL  the storefront API, e.g. https://batshi-api.onrender.com (falls back to VITE_API_BASE_URL)
 *   SITE_URL      the public address of the storefront (default https://batshi-home.co.il)
 *   EDGE_API_KEY  must equal EDGE_API_KEY on the API; lets these reads skip the API's per-address rate limit
 *   SHOP_ORIGIN   where WordPress/WooCommerce answers, for the sitemap files (default https://batshi-home.co.il).
 *                 Once the storefront takes over that domain this MUST be the new WordPress host.
 */
import { next } from "@vercel/functions";
import { DEFAULT_SITE_URL } from "./client/src/seo/config";
import { renderSeoPage } from "./client/src/seo/edge";
import { isSitemapPath, rewriteSitemap, shopSitemapPath } from "./client/src/seo/sitemap";

declare const process: { env: Record<string, string | undefined> };

export const config = {
  // Pages (anything without a file extension) and the sitemap files. Built files such as /assets/*.js are excluded.
  matcher: ["/((?!assets/|vendor/|api/|.*\\..*).*)", "/sitemap_index.xml", "/sitemap.xml", "/:kind-sitemap.xml", "/:kind-sitemap:n(\\d+).xml"],
};

const env = (name: string) => process.env[name]?.trim() || undefined;

async function sitemap(request: Request, url: URL): Promise<Response | undefined> {
  const shopOrigin = (env("SHOP_ORIGIN") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  // Reading the shop's files from the storefront's own host would just ask this middleware again.
  if (new URL(shopOrigin).host === url.host) return undefined;
  const siteOrigin = (env("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const upstream = await fetch(`${shopOrigin}${shopSitemapPath(url.pathname)}`, { headers: { accept: "application/xml,text/xml" } });
  if (!upstream.ok) return undefined;
  const xml = rewriteSitemap(await upstream.text(), shopOrigin, siteOrigin);
  return new Response(request.method === "HEAD" ? null : xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      // A sitemap on a preview address must not compete with the real one.
      ...(new URL(siteOrigin).host === url.host ? {} : { "x-robots-tag": "noindex" }),
    },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return next();
  const url = new URL(request.url);

  try {
    if (isSitemapPath(url.pathname)) return (await sitemap(request, url)) ?? next();

    const apiBase = (env("API_BASE_URL") ?? env("VITE_API_BASE_URL"))?.replace(/\/$/, "");
    if (!apiBase) return next();
    return await renderSeoPage(request, {
      apiBase,
      apiKey: env("EDGE_API_KEY"),
      siteUrl: (env("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, ""),
      indexHtml: async () => {
        const response = await fetch(new URL("/index.html", url));
        if (!response.ok) throw new Error(`index.html answered ${response.status}`);
        return response.text();
      },
    });
  } catch {
    return next();
  }
}
