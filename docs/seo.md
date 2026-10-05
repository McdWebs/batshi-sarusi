# Search engine visibility (SEO)

The storefront is a single-page app: the file the server sends is an empty shell and the page appears after the script runs. Search engines can run scripts, but later and less reliably, and an empty shell has the same title on every address. This is how the storefront keeps what the old WordPress site already earned.

## How it works

Three parts, all in code that is shared between the browser and the edge so they cannot disagree.

1. **`middleware.ts` (Vercel Routing Middleware).** Runs at the edge before the built site is served.
   - For every page address it reads the data from the storefront API, then returns `index.html` with that page's real `<title>`, description, canonical link, robots rule, link-preview tags (Open Graph / Twitter), structured data (JSON-LD) and a plain-HTML version of the content inside `<div id="root">`. React replaces that content when it loads.
   - A product or category that does not exist gets a real `404` status, not a `200` with an error message.
   - If the shop cannot be reached, or anything throws, the page falls back to the plain shell (never to an error), and that answer is cached for only 15 seconds.
   - It answers the sitemap addresses (`/sitemap_index.xml`, `/product-sitemap.xml`, `/product-sitemap2.xml`, ...) from the shop's own Yoast files, with the shop's address replaced by the storefront's. These are the addresses Google already knows.
   - Anything else (`/assets/*`, files with an extension) never reaches it, and if the middleware lets a request pass, `vercel.json` serves the app exactly as before.
2. **`client/src/seo/`.** Pure functions with no browser code: page type from the address (`route.ts`), titles, descriptions and canonical paths (`meta.ts`), structured data (`jsonld.ts`), head tags and the injection into `index.html` (`html.ts`), plain-HTML page bodies (`body.ts`), the request handler (`edge.ts`) and the sitemap rewrite (`sitemap.ts`).
3. **`usePageMeta` and `RouteMeta` (browser).** When a visitor moves between pages inside the app, the same tags are rewritten in `<head>`, so titles, canonical links and structured data stay right after every navigation and for crawlers that run the script.

## What each page gets

| Page | Title | Canonical | Structured data |
|---|---|---|---|
| Home | `בתשי הום - הכול לבית - batshi` (the title the old site ranks with) | `/` | Organization, WebSite with site search |
| Product | `<name> - batshi` | `/product/<slug>/` | Product (price or low-high price range, availability, SKU, brand, images, rating when there are reviews), BreadcrumbList |
| Category | `<name> - batshi` (`... - עמוד 2 - batshi` for later pages) | the old category path, `?page=N` for later pages | BreadcrumbList |
| Brand, shop, sale | same pattern | own path | none |
| Content pages | `<title> - batshi` | `/<slug>/` | none |
| Cart, checkout, account, search, owner tools, demo pages | brand title | none | none, and `noindex,follow` |

- Canonical addresses use the same shape as the old site (percent-encoded Hebrew, trailing slash), so Google sees the same address it already knows.
- A product the shop has no price for gets no price in its structured data (Google rejects an offer without one).
- Sorting and filtering options are not canonical: they point to the clean address, and `robots.txt` asks crawlers to skip them.
- **Safety:** any host other than `SITE_URL`'s (a Vercel preview, a test copy) gets `noindex` in the page and an `X-Robots-Tag` header, in the middleware and again in the browser. A preview can never compete with the real site.

## Settings

| Where | Name | Meaning |
|---|---|---|
| Vercel (and read at build for the client) | `VITE_API_BASE_URL` | Address of the storefront API. The middleware uses it unless `API_BASE_URL` is set. |
| Vercel | `API_BASE_URL` | Optional. Same as above, if the edge should use a different address. |
| Vercel | `SITE_URL` | Public address of the storefront, no trailing slash. Default `https://batshi-home.co.il`. |
| Vercel (client build) | `VITE_SITE_URL` | Same address, used by the browser for canonical links. |
| Vercel | `SHOP_ORIGIN` | Where WordPress answers, for the sitemap files. **Must be the new WordPress host after cutover** (see below). |
| Vercel and the API | `EDGE_API_KEY` | A long random value, identical on both. Lets the edge's reads skip the API's per-address rate limit (without it a crawl can be answered with errors). |

## Checking it

```bash
npm run build -w client
EDGE_API_KEY=... API_BASE_URL=http://localhost:3010 npm run preview:seo      # serves client/dist through middleware.ts, like Vercel
npx tsx scripts/seo-parity.ts --target=http://localhost:5173 --products=150  # every old sitemap address: 200, own title, canonical back to itself, one headline, Product data
npx tsx scripts/seo-parity.ts --all                                          # every product (about 20 minutes)
```

The parity script reads the old site's sitemaps and requests every page, category and brand, plus a random sample (or all) of the products. Run it against the real deployment before and after the switch.

Not tested here: the middleware on Vercel itself (the preview server runs the same code but is not Vercel), and how Google actually indexes the pages. Only Search Console shows that.

## Cutover checklist

1. **Deploy to a preview address** with all settings above. Everything on it will carry `noindex` by design.
2. Run the parity script against the preview. Zero failures is the goal; pages that are meant to stay out of search (cart, checkout, account) are skipped by the script.
3. **Move WordPress to its own host** (for example `admin.batshi-home.co.il`) and point `SHOP_ORIGIN`, `WOOCOMMERCE_BASE_URL` on the API and the DNS accordingly. The storefront then takes over `batshi-home.co.il`. Until `SHOP_ORIGIN` is right the sitemap addresses cannot be answered (the middleware refuses to ask its own host).
4. Add the production domain to the API's `CORS_ORIGIN`.
5. In Google Search Console: verify the domain, submit `https://batshi-home.co.il/sitemap_index.xml` (same address as today), and use the URL inspection tool on a product, a category and the home page ("view crawled page" should show the title and content).
6. Roll out gradually (10-20% of traffic first) if the hosting allows it, and watch indexed pages, impressions and clicks for the first weeks. Keep the old site available to switch back.
7. Optional later: redirect old WordPress search addresses (`/?s=term`) to `/search?q=term`; the old site's feeds and `/wp-*` addresses need nothing.

## Known limits

- Deep catalog pages (`?page=N`) list only that page's products in the plain HTML; the rest of the catalog is reached through the links on it and through the sitemap.
- The plain HTML has no photos on purpose (they would download twice before the app replaces them). Photos are in the structured data and the `og:image` tag.
- The edge reads the shop through the API on every uncached request. If the API is slow, a page falls back to the plain shell for 15 seconds and is retried.
