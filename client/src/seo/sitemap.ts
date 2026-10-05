/**
 * The old site already publishes complete, correct sitemaps (WordPress with Yoast) at fixed addresses that
 * Google knows. The storefront serves the same addresses, with the same pages, by reading the shop's files and
 * pointing every address at the storefront's own domain.
 */

/** The sitemap addresses Yoast uses: the index, and numbered files such as `product-sitemap2.xml`. */
export function isSitemapPath(pathname: string): boolean {
  return pathname === "/sitemap_index.xml" || pathname === "/sitemap.xml" || /^\/[a-z_]+-sitemap\d*\.xml$/.test(pathname);
}

export function shopSitemapPath(pathname: string): string {
  return pathname === "/sitemap.xml" ? "/sitemap_index.xml" : pathname;
}

/**
 * Replaces the shop's address with the storefront's in every link, and drops the stylesheet line that
 * points at the WordPress plugin. Only addresses on the shop's own host are touched.
 */
export function rewriteSitemap(xml: string, shopOrigin: string, siteOrigin: string): string {
  const shop = shopOrigin.replace(/\/$/, "");
  const site = siteOrigin.replace(/\/$/, "");
  const withoutStyle = xml.replace(/<\?xml-stylesheet[^>]*\?>\s*/g, "");
  return shop === site ? withoutStyle : withoutStyle.split(shop).join(site);
}
