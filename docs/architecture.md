# Architecture — Batshi Home Headless Storefront

**Status:** Audit complete. Implementation is **not** authorized until API compatibility and the uncertainties in `risks.md` are resolved with the client.

**Live store (source of truth):** https://batshi-home.co.il  
**WordPress site name:** `batshi`  
**Tagline:** בית לאוהבי הבישול והאירוח  
**Locale:** `he-IL`, RTL  
**Currency / market:** ILS (`₪`), shipping country default `IL`

---

## Current production stack (observed)

```text
Customer browser
        │
        ▼
Cloudflare  →  LiteSpeed  →  WordPress 6.x + WooCommerce 10.5.3
                                │
                                ├── Elementor 3.35.6 + Elementor Pro 3.33.1
                                ├── Hello Elementor + child theme
                                ├── WooCommerce Store API  (`/wp-json/wc/store/v1`)
                                ├── WooCommerce REST API v3 (`/wp-json/wc/v3`, authenticated)
                                └── Plugins that change price, shipping, cart, payment, merchandising
```

The current customer UI is **not** a headless app. It is a WordPress theme built with Elementor, JetEngine/Crocoblock widgets, and WooCommerce templates.

---

## Target architecture (from `plan.md`)

```text
Customer
   ↓
React + Vite storefront  (Vercel)
   ↓
Node + Express API layer  (Render or equivalent)
   ↓
WooCommerce Store API + REST API
   ↓
Existing WordPress / WooCommerce (unchanged admin)
```

### Why no application database initially

WooCommerce already owns products, variations, prices, stock, categories, coupons, cart, shipping, checkout, customers, and orders.

A second database would duplicate catalog and order state and create sync bugs. Persistent storage should be added later only for data WooCommerce cannot reasonably own (for example a merchandising config the client cannot manage in WP).

---

## API strategy (verified against production)

| Concern | Use | Why |
|---|---|---|
| Product listing, search, category, product detail, attributes, brands, tags | **Store API** (public) | Confirmed live: **3,406** products, pagination headers, search, `on_sale`, `category`, `type=variable`, slug lookup |
| Guest cart: add/update/remove, coupons, shipping rates, customer address | **Store API cart** | Confirmed: `POST /cart/add-item` returned **201** with `Nonce` + `Cart-Token` |
| Checkout / order creation | **Store API checkout** | Exists. `GET /checkout` returns **401** without nonce. Must be proxied carefully |
| Admin-grade data (gateways config, system status, private customer/order lists, related-product IDs if missing from Store API) | **REST API v3** with consumer key/secret **on the server only** | Unauthenticated calls return 401 as expected |
| JetSearch / JetSmartFilters | Do **not** depend on these for the new app | They are Elementor-bound. Prefer Store API `search` and attribute/category filters |

The Express layer must:

- Keep `WOOCOMMERCE_CONSUMER_KEY` / `SECRET` off the browser
- Forward Store API `Nonce` and `Cart-Token` (or manage a server-side cart session)
- Normalize WooCommerce payloads into application types
- Never invent catalog, prices, or shipping

---

## Data that already lives in WooCommerce

Confirmed on the live Store API:

- Simple and variable products (sample of first 100: 76 simple / 24 variable; **624** variable in the full catalog)
- Sale vs regular prices (minor units, ILS)
- Stock flags and Hebrew availability text (`קיים במלאי`)
- SKU
- Images on `batshi-home.co.il/wp-content/uploads/`
- Nested categories (167), brands (5), tags (few, some used as shipping flags)
- Reviews endpoint exists and currently returns **0** reviews
- Cart totals, shipping method selection, local pickup
- Coupons (Store API routes + `woocommerce-smart-coupons` cart extension)

Not present or not reliable from Store API alone:

- Related / upsell / cross-sell fields on the product object (keys absent)
- Featured products (`featured=true` total **0**)
- HTML product descriptions on sampled new products (often empty)
- Payment gateway internals (only method id `grow-wallet-payment` is exposed to the cart)

---

## What must stay in WordPress

Batshi continues to:

- Add/edit products, images, sale prices, stock
- Manage categories, attributes, variations
- Configure shipping rules (PI SOL / Advanced Free Flat Shipping Pro)
- Manage coupons / Smart Coupons / Discount Rules
- Take orders and print invoices (WebToffee)
- Run affiliate (YITH WCAF)
- Possibly run WooCommerce POS (`wc/pos` namespace present)

The React app is a **customer channel**, not a second admin.

---

## Caching boundary

Observed on production:

- LiteSpeed page cache (`x-litespeed-cache-control: public,max-age=604800` on the homepage)
- Cloudflare in front (`server: cloudflare`, `cf-cache-status: DYNAMIC` on HTML)
- Store API product responses are `noindex`

The new stack must **not** cache cart, checkout, payment, or account responses. Catalog cache must be short because sale prices and stock change often (2,471 products currently `on_sale=true`).

---

## Security boundary

- Wordfence namespace is registered
- WooCommerce REST v3 is correctly locked
- Store API cart uses JWT `Cart-Token` + rotating `Nonce`
- Cookie consent plugin (WPConsent) is present
- `robots.txt` disallows `/wp-json/` for crawlers (Yoast). The API still works for clients; do not rely on it being secret

Never put consumer secrets in Vite env vars.

---

## Implementation gate

Do not start the Express/React build until the client confirms:

1. WooCommerce REST API keys for a **server** integration (read products/settings; cart/checkout via Store API)
2. Grow (and Meshulam) headless/checkout support
3. Whether Discount Rules / ELEX / TM Extra Product Options / Smart Coupons must be reproduced 1:1
4. Staging WordPress vs testing against production

See `decisions.md` and `risks.md`.
