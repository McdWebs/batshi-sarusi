# Integration Map — Plugins and Business Systems

Every item was inferred from **live HTML plugin paths**, **WP REST namespaces**, Store API `extensions`, or sitemaps. Admin wp-admin was not accessed.

Legend:

- **API available?** Public or authenticated WP/Woo API observed
- **Frontend?** New React app must implement equivalent UX
- **Backend?** Express must call Woo/plugin, not re-implement
- **Risk:** High = can break price, stock, payment, or legal behavior if ignored

---

## Commerce core

| Plugin | Purpose | Affected functionality | API? | Frontend | Backend | Risk |
|---|---|---|---|---|---|---|
| WooCommerce 10.5.3 | Catalog, cart, checkout, accounts | Entire store | Store API public; REST v3 auth | Yes | Yes | High |
| WooCommerce Smart Coupons (`wc/v3/sc`, cart `extensions`) | Gift/store credit style coupons | Coupons, possible gift cards | Partial (Store API coupon + extension blob) | Yes if used at checkout | Yes | High |
| Advanced Woo Discount Rules + Pro (`woo-discount-rules`) | Dynamic discounts on top of Woo prices | Displayed price, cart discounts | No public catalog of rules | Must show **Woo/plugin price**, not a local formula | Yes — never re-code rules | High |
| ELEX Woo Flexible Pricing | Role/qty/wholesale pricing | “סיטונאי” prices, maybe B2B | Unknown | Must display API price | Yes | High |
| WooCommerce TM Extra Product Options | Extra fields / add-ons | Product options beyond attributes | Unknown on Store API | Only if products use it | Yes | High |
| WooCommerce Pre-Orders | Charge later / date-based availability | Titles already mention מכירה מוקדמת | Unknown | Show pre-order state from API if exposed | Yes | Medium |
| Easy Sale Badges for WooCommerce | On-image sale badges | Merchandising | Plugin REST `asnp-easy-sale-badge/v1` (admin-oriented) | Derive from live sale data; do not fake “2 left” | Optional | Medium |
| WooCommerce Side Cart Premium | Mini-cart drawer | Cart UX | Uses Woo fragments / ajax | Rebuild drawer against Store API cart | Yes | Low |

---

## Shipping

| Plugin | Purpose | Affected functionality | API? | Frontend | Backend | Risk |
|---|---|---|---|---|---|---|
| Advanced Free Flat Shipping WooCommerce Pro (PI SOL) | Conditional flat rates | ₪39/14 days, free-shipping variants, ₪100, ₪39/furniture, courier ₪299/₪499, exclusions via tags | Quotes appear on Store API `shipping_rates`. Method id `pisol_extended_flat_shipping` | Show live rates only | Yes | High |
| WooCommerce Local Pickup | Pickup in Holon warehouse | Free pickup, hours, address | Store API rate `local_pickup:2` | Yes | Yes | Medium |

Homepage copy: free shipping above ₪399. **Not confirmed as a single `free_shipping` method on a ₪59 cart.** Confirm with Batshi / Woo settings.

---

## Payments

| Plugin / method | Purpose | Affected functionality | API? | Frontend | Backend | Risk |
|---|---|---|---|---|---|---|
| **Grow Wallet** (`grow-wallet-payment`) | Primary method returned by Store API cart | Checkout, likely cards + Bit via Grow | Store API method id; JS SDK + `admin-ajax.php` | Must use Grow-supported headless flow | Yes — never store cards | **Critical** |
| **Meshulam** (`meshulam-payment-gateway`) | Israeli gateway plugin loaded on cart/checkout | Possibly inactive or fallback | Not listed in Store API `payment_methods` during audit | Unknown | Unknown | High |
| WooCommerce PayPal routes | Present in REST index | Not observed as active cart method | Auth REST | No unless activated | — | Low unless enabled |
| Bit | Mentioned in checkout/cart assets | May be inside Grow | Unverified | Unverified | Unverified | High |

**Do not implement checkout until Grow (and Meshulam, if active) document iframe vs redirect vs 3DS vs webhooks for Store API.**

---

## Merchandising / CMS

| Plugin | Purpose | Affected functionality | API? | Frontend | Backend | Risk |
|---|---|---|---|---|---|---|
| Elementor + Pro | Entire layout | Homepage, menus, landing pages | Elementor REST (not useful for React) | Redesign; keep **content** from Woo/pages | No | Medium (content migration) |
| JetEngine | Dynamic listings, possibly wishlist CPT | Grids, banners | `jet-engine` REST | Recreate with TanStack Query + Woo data | No | Medium |
| JetSearch | Header search | Suggestions | `jet-search/v1` | Use Store API search | Optional | Low |
| JetSmartFilters | Shop filters | Facets | `jet-smart-filters-api/v1` | Use real attributes that have counts | No | Medium (messy attributes) |
| JetMenu / JetPopup | Nav and popups | UX | Plugin REST | Rebuild simpler nav | No | Low |
| Jet Woo Product Gallery | PDP gallery | Images | Plugin REST | Use Woo `images[]` | No | Low |
| Homepage banners CPT | Hero/promo | Homepage | `wp/v2/homepage_banners` public | Maybe | Read-only | Low |
| Code Snippets | Custom PHP | Unknown price/shipping/UX tweaks | Admin REST | Unknown | Unknown | **High** (hidden logic) |

---

## Customers, CRM, loyalty

| Plugin | Purpose | Affected functionality | API? | Frontend | Backend | Risk |
|---|---|---|---|---|---|---|
| WooCommerce accounts | Login, orders, addresses | `/my-account/` | Store API customer + REST v3 | If we keep accounts | Session/auth design TBD | High |
| YITH WooCommerce Affiliates Premium | Affiliate links, dashboard | `/affiliate-dashboard/`, tracking | `yith-wcaf/*` (likely cookie + REST) | Keep WP page or later port | Do not break affiliate cookies | Medium |
| Gift cards | Category **גיפט קארד** (126 products) | May be Smart Coupons or just cheap SKUs | Unverified | Do not invent gift-card UX | Confirm with client | Medium |
| Wishlist | Published page “רשימת המשאלות שלי” | Account-adjacent | **No wishlist plugin detected** | Confirm if real | — | Low |
| VIP copy in nav | “מוצרים VIP בהנחות” | Possibly category or ELEX role prices | Unverified | Do not fake VIP | Confirm | Medium |

No ERP, external inventory, or CRM pixel was identified in public HTML.

---

## Ops, SEO, legal, performance

| Plugin | Purpose | Affected functionality | API? | Frontend | Backend | Risk |
|---|---|---|---|---|---|---|
| Yoast SEO | Titles, JSON-LD, sitemaps | SEO equity | `yoast/v1`, sitemaps | Recreate meta + redirects | Sitemap strategy | High (URL change) |
| LiteSpeed Cache | HTML/object cache | Stale prices if mis-cached | `litespeed/*` | New app caching rules | Don’t cache cart | Medium |
| Cloudflare | CDN/WAF | TLS, maybe bot challenges | — | — | — | Medium |
| Wordfence | WAF | May block Store API bursts | `wordfence/v1` | — | Rate-limit politely | Medium |
| Jetpack | Various | Unknown | `jetpack/v4` | — | Confirm | Low |
| WPConsent | Cookie consent | Analytics injection | — | Required legally if tracking | — | Medium |
| Pojo Accessibility + Elementor Ally | A11y overlay | Widget on site | `ea11y` | Build accessible UI; overlay optional | No | Low |
| Shamor | Shabbat store close | Checkout disabled on Shabbat? | Unknown | Must honor closed state | Yes | **High** |
| WebToffee invoice / packing slips | Admin documents | After order | Public JS loaded (unnecessary on storefront) | No | Woo emails remain | Low |
| WooCommerce POS | In-store catalog | Namespace `wc/pos` | Staff only | No | Don’t collide stock | Medium |

---

## Analytics (unverified)

Public homepage HTML did **not** contain GTM, GA4, or Meta Pixel IDs. WPConsent may load them after consent. **Ask the client for GTM container / Meta Pixel / GA4 IDs** before building analytics. Do not double-count purchases.

Instagram: `batshi_sarosi`. Possible Meta traffic via link-in-bio.

---

## Systems not found (do not assume)

- External ERP
- Dedicated review platform (Yotpo, Judge.me, etc.) — Woo reviews empty
- Dedicated ESP / Klaviyo in HTML
- WhatsApp Business widget with a phone number (copy mentions WhatsApp; no `wa.me` on homepage)
- Google Tag Manager snippet in first paint
