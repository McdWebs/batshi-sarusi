# API Inventory — Live WooCommerce Installation

**Base:** `https://batshi-home.co.il`  
**WP REST index:** `GET /wp-json/` (1051 routes registered)  
**Do not invent endpoint behavior.** Below is what this installation actually exposes.

---

## 1. Preferred customer API: WooCommerce Store API

Namespace: `wc/store` and `wc/store/v1` (use **v1**).

### Products

| Method | Path | Auth | Observed |
|---|---|---|---|
| GET | `/wp-json/wc/store/v1/products` | Public | 200. `X-WP-Total: 3406`. Query: `page`, `per_page`, `search`, `category`, `type`, `on_sale`, `featured`, `stock_status`, `orderby`, `order` |
| GET | `/wp-json/wc/store/v1/products/:id` | Public | 200. Full product object |
| GET | `/wp-json/wc/store/v1/products/:slug` | Public | 200 for Hebrew slug (URL-encoded) |
| GET | `/wp-json/wc/store/v1/products/categories` | Public | 200. 167 categories, `parent`, `count`, permalinks |
| GET | `/wp-json/wc/store/v1/products/categories/:id` | Public | Registered |
| GET | `/wp-json/wc/store/v1/products/attributes` | Public | 200. 40+ global attributes |
| GET | `/wp-json/wc/store/v1/products/attributes/:id` | Public | Registered |
| GET | `/wp-json/wc/store/v1/products/attributes/:attribute_id/terms` | Public | Registered |
| GET | `/wp-json/wc/store/v1/products/brands` | Public | 200. 5 brands |
| GET | `/wp-json/wc/store/v1/products/brands/:identifier` | Public | Registered |
| GET | `/wp-json/wc/store/v1/products/tags` | Public | 200 |
| GET | `/wp-json/wc/store/v1/products/reviews` | Public | 200, **total 0** |
| GET | `/wp-json/wc/store/v1/products/collection-data` | Public | Exists; `calculate_attribute_counts` requires object-array params (400 if passed as boolean) |

**Product object fields observed:**  
`id`, `name`, `slug`, `parent`, `type`, `variation`, `permalink`, `sku`, `short_description`, `description`, `on_sale`, `prices`, `price_html`, `average_rating`, `review_count`, `images[]`, `categories[]`, `tags[]`, `brands[]`, `attributes[]`, `variations[]` (id + attribute values), `grouped_products`, `has_options`, `is_purchasable`, `is_in_stock`, `is_on_backorder`, `low_stock_remaining`, `stock_availability`, `sold_individually`, `add_to_cart` (`minimum`/`maximum`/`multiple_of`), `extensions`.

**Missing from Store API product (sampled):** related, upsells, cross-sells, weight, dimensions, date, featured flag on the object (filter `featured=true` still works at list level).

**Prices:** string integers in minor units. `currency_code: ILS`.

**Variations:** parent `type: variable`; each variation is `GET /products/:variationId` with `type: variation` and `parent`.

**Search:** `GET /products?search=כוס` → `X-WP-Total: 281`. Server-side; do not download the full catalog.

**Sort:** `orderby=price&order=asc` works. `orderby=date` works. Default list appears newest-first.

### Cart

| Method | Path | Auth | Observed |
|---|---|---|---|
| GET | `/wp-json/wc/store/v1/cart` | Public + cart token | 200. Empty guest cart. Headers: `Nonce`, `Nonce-Timestamp`, `Cart-Token`, `Cart-Hash`, `User-Id` |
| POST | `/wp-json/wc/store/v1/cart/add-item` | `Nonce` + `Cart-Token` | **201** with body `{"id":36870,"quantity":1}` |
| POST | `/wp-json/wc/store/v1/cart/update-item` | Nonce + token | Registered |
| POST | `/wp-json/wc/store/v1/cart/remove-item` | Nonce + token | Registered |
| POST/PUT/DELETE | `/wp-json/wc/store/v1/cart/items` and `/items/:key` | Nonce + token | Registered |
| POST | `/wp-json/wc/store/v1/cart/apply-coupon` | Nonce + token | Registered (Smart Coupons extension present) |
| DELETE | `/wp-json/wc/store/v1/cart/remove-coupon` | Nonce + token | Registered |
| GET | `/wp-json/wc/store/v1/cart/coupons` | Nonce + token | Registered |
| POST | `/wp-json/wc/store/v1/cart/update-customer` | Nonce + token | **200**. Recalculates shipping for IL address |
| POST | `/wp-json/wc/store/v1/cart/select-shipping-rate` | Nonce + token | Registered |
| POST | `/wp-json/wc/store/v1/cart/extensions` | Nonce + token | Registered |
| POST | `/wp-json/wc/store/v1/batch` | Mixed | Registered |

**CORS headers on cart:**  
`Access-Control-Allow-Headers` includes `Authorization, X-WP-Nonce, Cart-Token, Nonce`.  
`Access-Control-Allow-Credentials` is present. A browser app on another origin **may** still fail CORS origin checks — Express proxy is the safe design.

**Cart `payment_methods` observed:** `["grow-wallet-payment"]`.

**Cart `extensions` observed:** `woocommerce-smart-coupons`.

### Checkout / orders

| Method | Path | Auth | Observed |
|---|---|---|---|
| GET/POST | `/wp-json/wc/store/v1/checkout` | Nonce required | **GET 401** `woocommerce_rest_missing_nonce` without nonce |
| GET/POST | `/wp-json/wc/store/v1/checkout/:id` | Nonce | Registered |
| GET | `/wp-json/wc/store/v1/order/:id` | Session | Registered |

Do not call checkout from the browser with secrets. Do not simulate payment success.

---

## 2. WooCommerce REST API v3 (authenticated, server-only)

Namespace: `wc/v3` (also v1/v2). **117 v3 routes**.

Unauthenticated `GET /wp-json/wc/v3/products` → **401** `woocommerce_rest_cannot_view`. Correct.

Needed later (with keys) for data Store API does not give:

- `GET /wc/v3/products/:id` — related_ids, upsell_ids, cross_sell_ids, meta, date
- `GET /wc/v3/products/:id/related`
- `GET /wc/v3/payment_gateways`
- `GET /wc/v3/shipping_methods` and shipping zone methods
- `GET /wc/v3/settings`
- `GET /wc/v3/system_status`
- `GET /wc/v3/customers`, `/orders` (never expose admin credentials to the storefront)
- `GET /wc/v3/coupons`
- `GET /wc/v3/products/reviews`
- Smart Coupons: `/wc/v3/sc` and `/wc/v3/sc/coupons`

PayPal routes exist (`/wc/v3/paypal-buttons`, `paypal-webhooks`, `paypal-standard`). That does **not** mean PayPal is an active checkout method. Cart only returned Grow.

---

## 3. WordPress content APIs (public)

| Method | Path | Observed |
|---|---|---|
| GET | `/wp-json/wp/v2/pages` | 15 pages (see route-map) |
| GET | `/wp-json/wp/v2/posts` | total **0** |
| GET | `/wp-json/wp/v2/types` | includes `product`, `homepage_banners`, `pi_shipping_method`, `jet-menu`, `elementor_library` |
| GET | `/wp-json/wp/v2/homepage_banners` | 3 items |
| GET | `/wp-json/wp/v2/pi_shipping_method` | 6 published shipping rule posts |
| GET | `/wp-json/wp/v2/menus` | **401** |

Use pages for legal/about/contact HTML. Do not scrape Elementor CSS as a long-term strategy; extract approved copy.

---

## 4. Plugin APIs (generally not for the new storefront)

| Namespace | Role | Storefront use |
|---|---|---|
| `jet-search/v1` | Ajax search for Elementor | Prefer Store API search |
| `jet-smart-filters-api/v1` | Filter widgets | Prefer Store API category/attribute/price |
| `jet-engine/v1`, `v2` | Dynamic content | Avoid coupling |
| `yith-wcaf/*` | Affiliate dashboard | Keep on WordPress unless client wants a new affiliate UI |
| `advanced-free-flat-shipping-woocommerce-pro/v1` | Shipping admin | Shipping **quotes** already appear on Store API cart |
| `asnp-easy-sale-badge/v1` | Sale badges | Visual; derive badges from `on_sale` / plugin rules — **rules not in Store API** |
| `code-snippets/v1` | PHP snippets | Unknown business logic — **risk** |
| `litespeed/v1`, `v3` | Cache | Ops only |
| `wordfence/v1` | Security | Ops only |
| `yoast/v1` | SEO | Titles/schema should be rebuilt in the app from product fields + Yoast if exported |
| `elementor/*`, `jet-*` | Builder | Do not call from React |
| `wc/pos/v1/catalog` | Point of sale | In-store, not web checkout |
| `wc-admin`, `wc-analytics` | Admin | Forbidden from public app |
| `jetpack/v4` | Jetpack | Unclear if required for storefront |

---

## 5. Traditional WooCommerce storefront (non-REST)

Still how the **current** site works:

- `/?add-to-cart=` (disallowed in robots)
- `admin-ajax.php` (Grow `grow_params.ajax_url`, cart fragments, side cart, discount rules)
- Classic `/cart/` and `/checkout/` pages
- Cookie session for logged-in customers

The headless app should **not** scrape these. It should use Store API via Express.

---

## 6. Proposed Express facade (not implemented)

These are **application** routes to design after keys and payment confirmation. They are **not** live on this repo.

```text
GET    /health
GET    /api/products
GET    /api/products/:idOrSlug
GET    /api/categories
GET    /api/search
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:key
DELETE /api/cart/items/:key
POST   /api/cart/coupon
DELETE /api/cart/coupon
POST   /api/cart/customer
POST   /api/cart/shipping-rate
POST   /api/checkout          # blocked until Grow/Meshulam verified
```

Exact request/response mapping must follow live Store API fields, including minor-unit prices and Hebrew slugs.

---

## 7. Compatibility verdict

| Capability | Store API today | Blocker |
|---|---|---|
| Browse catalog | Yes | None |
| Search | Yes | None |
| Categories / brands | Yes | Curate nav; don't use raw 167 |
| Variations | Yes | Extra Product Options may add fields outside variations |
| Guest cart | Yes (nonce + cart-token) | Proxy + CORS |
| Shipping quotes | Yes (PI SOL rates appear) | Rule matrix not fully documented |
| Coupons | Routes + Smart Coupons extension | Discount Rules may alter price **before** cart |
| Checkout / Grow | Namespace exists | **Payment SDK + nonce + 3DS unverified** |
| Accounts | Not via public Store API | Need Store API nonce session, Login with Woo, or Application Passwords / JWT — **unverified** |
| Reviews | Empty | Fine to omit write UI until reviews exist |
| Related products | Not in Store API body | Need v3 keys or Woo related-products endpoint |
