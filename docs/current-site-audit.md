# Current Site Audit — https://batshi-home.co.il

**Audited:** 19 August 2026  
**Method:** Live HTTP inspection of HTML, WordPress REST index, WooCommerce Store API, sitemaps, cart mutations. No mock data. No new UI.

---

## 1. What the store is

Israeli home / kitchen / textile retailer (“בתשי הום”). Positioning on the homepage:

- Most site prices are **wholesale-style** (“רוב המחירים באתר אלו מחירים סיטונאים”)
- Supply in **up to 14 business days**
- **Free shipping over ₪399** (“בקנייה מעל 399 משלוח חינם עד הבית”)
- Heavy deal merchandising (“מבצעי כאסח”, gift-card-priced items, seasonal Rosh Hashanah 2026)

Currency is ILS. Catalog is Hebrew. HTML is `dir="rtl" lang="he-IL"`.

---

## 2. Theme and presentation layer

| Piece | Evidence |
|---|---|
| Theme | `hello-elementor` + `hello-elementor-child` |
| Page builder | Elementor 3.35.6, Elementor Pro 3.33.1 |
| Crocoblock / Jet | JetEngine 3.8.5, JetElements, JetBlocks, JetMenu, JetPopup, JetSearch, JetSmartFilters (via JetEngine), Jet Woo Product Gallery |
| Extra Elementor | Gloo, clickable columns, Custom Fonts |
| Accessibility overlay | Pojo Accessibility + Elementor Ally (`ea11y`) widget |
| Cookie banner | WPConsent |
| Alternate homepage | `/home-v2/` titled **בתשי הום – עיצוב חדש** (published page, not the current front page) |

The front page is WP page id **2973** (`slug: home`), not `home-v2`.

Custom post type `homepage_banners` exists (3 published items) — merchandising is partly CMS, not only Woo categories.

---

## 3. Catalog (live Store API)

| Metric | Value |
|---|---|
| Products (`X-WP-Total` on `/wc/store/v1/products`) | **3406** |
| Variable products (`type=variable`) | **624** |
| On sale (`on_sale=true`) | **2471** |
| Featured (`featured=true`) | **0** |
| Out of stock (`stock_status=outofstock`) | **817** |
| Reviews (`/products/reviews`) | **0** |
| Categories | **167** (nested) |
| Brands | **5** (Food Appeal 254, BENETTON, Pip Studio, Cucina Mia, דגם הרמס) |
| Yoast product sitemap URL count | 1000+1000+1000+406 including `/shop/` ≈ catalog size |

### Product types

- **Simple** products dominate.
- **Variable** products use global attributes, mainly **צבע** and **גודל ומידות**, plus many product-specific size attributes.
- Sampled grouped products: none in the first 100.
- Store API `has_options` tracks variable products.

### Pricing

Store API prices use **minor units** (`currency_minor_unit: 2`). Example live product id `36870`:

- regular `69900` → ₪699.00
- sale `5900` → ₪59.00
- `on_sale: true`

Additional price engines are installed (see integrations): Discount Rules, ELEX Flexible Pricing. Displayed sale price is **not** guaranteed to be “only WooCommerce sale_price”.

### Content quality (implementation-relevant)

On newly added products, `description` and `short_description` were often **empty**. Images are frequently WhatsApp-exported JPEGs with empty `alt`. SKUs mix barcodes (`7290…`) and internal codes (`X6067`).

Products are often assigned to **many** categories at once (deal buckets + seasonal + taxonomy). Category counts therefore overlap heavily.

### Tags as operational flags

Observed tags include `אין משלוח חינם`, `הובלה 100 ש״ח`, `הובלה 39 ש״ח`, `משלוח`. Shipping exceptions appear to be modeled as **tags + PI SOL rules**, not a single free-shipping zone.

---

## 4. Navigation and merchandising

Header/menu (from homepage chrome, menus REST is private):

- כל המוצרים שלנו
- אודות / צור קשר / המשתמש שלי
- מבצעי כאסח
- אחרונים במלאי – חיסול (`/product-category/clearance/`)
- מוצרים VIP בהנחות
- סידור הבית
- BENETTON
- Seasonal / influencer collections (אתי אפינגר, טליה סול)
- מבצעים בקנייה מעל 399
- הסטוקים שלנו
- גיפט קארד (category, not confirmed as a gift-card product type)

**Do not dump all 167 categories into the header.** The live site already curates; many categories are merchandising buckets (`כל המוצרים שלנו` count 3175, `Uncategorized` 225).

Shop-by-category on the homepage includes: בישול ומטבח, אקריל/ארגון, טקסטיל, מוצרי חשמל, שולחן שבת, כוסות, מערכות אוכל, פעמונים.

---

## 5. Shopping experience

| Surface | Current behavior |
|---|---|
| Homepage | Elementor product grids + banners + deal modules; live Woo products |
| Shop | `/shop/` — Jet Smart Filters present; very large HTML (~650KB+) |
| Category | `/product-category/{nested-slugs}/` — 167 URLs in sitemap |
| Brand | `/brand/{slug}/` |
| Product | `/product/{slug}/` — add to cart, SKU, Jet gallery, Discount Rules assets, pre-order plugin loaded |
| Search | JetSearch in header; Store API `?search=` works (e.g. `כוס` → 281 products). WP `/?s=` was not verified (request failed in one client) |
| Cart | `/cart/` classic Woo + **Side Cart Premium** (`xoo-wsc`). Empty cart copy in Hebrew. Coupon field present. Empty **checkout redirects to cart** |
| Checkout | `/checkout/` — Grow JS (`grow_params`, `growPayment.init`). Meshulam plugin also enqueued. Store API lists **only** `grow-wallet-payment` |
| Account | `/my-account/` login + registration. `/my-account/orders/` exists (login wall) |
| Wishlist | Page `/רשימת-המשאלות-שלי/` is published. **No dedicated wishlist plugin folder** found on that page. Treat as unverified / possibly JetEngine or unused |
| Affiliates | `/affiliate-dashboard/` + YITH WCAF Premium |
| Legal | תקנון אתר, מדיניות פרטיות, הצהרת נגישות |
| Contact / About | `/צור-קשר/`, `/אודות/` |
| Promo pages | `/sale/` (מבצע יומי), `/hot/` (המומלצים של בתשי) |

---

## 6. Cart and shipping (live mutation)

Guest Store API cart after adding product `36870` (sale ₪59.00):

- `needs_shipping: true`, `needs_payment: true`
- Selected rate: **אספקה עד 14 ימי עסקים** — `pisol_extended_flat_shipping:3548` — **₪39.00**
- Alternate: **איסוף מקומי** 10:00–17:00, **הסדנא 8 חולון (קומה 1 מחסן 122), בתיאום מראש** — ₪0
- Totals: items ₪59 + shipping ₪39 = ₪98
- `tax_lines: []`, all tax fields `0` (prices likely VAT-inclusive or tax disabled)
- `payment_methods: ["grow-wallet-payment"]`
- `extensions.woocommerce-smart-coupons.coupon_metadata: []`
- `cross_sells: []`

Updating customer address to Tel Aviv did **not** change the ₪39 rate for this SKU.

### Shipping methods CPT (PI SOL), 6 published

1. אספקה עד 14 ימי עסקים (multiple instances, including “חינם” variant)
2. הובלה 39 ₪ פר רהיט
3. הובלה 100 ₪
4. הובלה — תשלום ישירות לשליח: מרכז וגוש דן ₪299, דרום וצפון ₪499

**Free-shipping-at-399 is advertised on the site.** It was **not** triggered on a ₪59 cart. Confirm the actual threshold and exclusions (tags `אין משלוח חינם`, furniture rates) before building a progress bar. Do not hardcode ₪399.

---

## 7. Payments

Observed:

- Store API checkout payment method id: **`grow-wallet-payment`** (Grow)
- Plugin enqueued on cart/checkout: **`meshulam-payment-gateway`**
- Inline Grow SDK hooks: `GrowSdk`, `growPayment.init`, `grow_params.ajax_url`
- HTML also mentions **bit** in checkout/cart assets (Israeli instant payment; confirm whether it is Grow-hosted Bit or a separate method)

**Checkout is high-risk.** Grow and Meshulam are redirect/SDK gateways. Headless support, 3DS, webhooks, and PCI constraints are **unverified**. Do not implement checkout until the gateway vendor confirms a Store API / custom payment strategy.

---

## 8. Accounts, reviews, options

- Native WooCommerce customer accounts: login, register, orders.
- Reviews: Store API total 0. Product page sampled had no reviews tab content. Do not fake ratings.
- **WooCommerce TM Extra Product Options** is installed (loaded on cart/shop). Not seen on the sampled simple product. Some SKUs may have extra fields that Store API `attributes` will not cover.
- **WooCommerce Pre-Orders** is installed. Some product titles mention מכירה מוקדמת / מלאי dates.
- **Shamor** plugin is present (typical Israeli “close store on Shabbat” behavior). New storefront must respect store-closed state if Shamor blocks checkout.

---

## 9. Analytics and marketing

| Channel | Finding |
|---|---|
| Instagram | https://www.instagram.com/batshi_sarosi |
| WhatsApp | Homepage mentions WhatsApp; many images are WhatsApp exports. **No `wa.me` number found** in homepage HTML |
| GTM / GA4 / Meta Pixel | **Not present as plaintext IDs** in homepage HTML. WPConsent is installed and may inject tags after consent — **unverified** |
| Yoast SEO | Active. JSON-LD WebPage + BreadcrumbList on product. Product schema completeness unverified |
| Facebook / IG query params | One non-browser client received a homepage 301 adding `fbclid` / `utm_source=ig` (link-in-bio style). Normal Chrome-like `HEAD` returned **200**. Investigate if a marketing plugin rewrites `/` |

No blog posts (`wp/v2/posts` total 0).

---

## 10. SEO and URLs

- Canonical pattern: Hebrew percent-encoded slugs (critical to preserve).
- `robots.txt`: Yoast block disallows `/wp-json/`; Woo upload/log paths disallowed; sitemap advertised as `sitemap_index.xml`.
- `https://batshi-home.co.il/sitemap.xml` returned **500** during audit.
- `https://batshi-home.co.il/sitemap_index.xml` returned **200** (Yoast).
- Page sitemap includes `/cart/`, `/checkout/`, `/my-account/`, `/affiliate-dashboard/`, `/home-v2/` — several of these should usually be `noindex`.

---

## 11. Performance (current site)

Homepage HTML ~530KB; shop ~650KB+. Elementor + many plugin scripts (Woo fragments, side cart, discount rules, Jet*, Elementor Pro). LiteSpeed cache on HTML. This is a major conversion/performance motivation for the new front-end, but the **commerce complexity must be preserved**.
