# Batshi Home storefront

Headless customer storefront for [batshi-home.co.il](https://batshi-home.co.il). WordPress / WooCommerce remains the source of truth.

Checkout and payments (Grow / Meshulam) are **not implemented**. The catalog, search, product pages, and cart use live WooCommerce data.

## Stack

- React + Vite + MUI (RTL) in `client/`
- Express + TypeScript API in `server/`
- Live WooCommerce Store API (`/wp-json/wc/store/v1`)
- Public WordPress REST for legal/about pages
- No application database

## Run

```bash
cp .env.example .env
npm install
npm run dev
npm run dev:client
```

Default local ports (change in `.env` if they collide with other projects):

- API: `http://localhost:3010`
- Storefront: `http://localhost:5173` (Vite picks the next port if 5173 is taken)

Health: `GET http://localhost:3010/health` → `{ "status": "ok" }`

WooCommerce REST consumer keys are **not required** for this phase. Leave them empty. Do not put them in any frontend env file.

## API

| Method | Path | Source |
|---|---|---|
| GET | `/health` | local |
| GET | `/api/products` | Store API products |
| GET | `/api/products/:idOrSlug` | Store API product id or slug |
| GET | `/api/categories` | Store API categories |
| GET | `/api/brands` | Store API brands |
| GET | `/api/search?q=` | Store API `search` |
| GET | `/api/pages` | WP REST pages |
| GET | `/api/pages/:slug` | WP REST page |
| GET | `/api/banners` | WP REST `homepage_banners` (empty if CPT missing) |
| GET | `/api/studio/sample` | Live in-stock products with no description (content studio demo). Needs the studio access code |
| POST | `/api/studio/generate` | Gemini: Hebrew product content, or a rewrite from an instruction. Needs the studio access code |
| GET | `/api/studio/back-in-stock` | Sold-out products ranked by how many people are waiting (counts only). Needs the studio access code |
| POST | `/api/back-in-stock` | A shopper asks to be told when a sold-out product is back (demo, no email is sent) |
| GET | `/api/cart` | Store API cart |
| POST | `/api/cart/items` | Store API add-item |
| PUT | `/api/cart/items/:key` | Store API update item |
| DELETE | `/api/cart/items/:key` | Store API remove item |
| POST | `/api/cart/customer` | Store API update-customer |
| POST | `/api/cart/shipping-rate` | Store API select-shipping-rate |
| POST | `/api/cart/coupon` | Store API apply-coupon |
| DELETE | `/api/cart/coupon` | Store API remove-coupon |

Our public cart item routes stay REST-shaped (`PUT` / `DELETE /api/cart/items/:key`). Internally they call Store API `POST /cart/update-item` and `POST /cart/remove-item`, which return the full cart.

### Cart session

WooCommerce guest carts use rotating `Nonce` plus `Cart-Token`.

The API accepts and returns:

- `X-Cart-Token`
- `X-Cart-Nonce`

Cart JSON also includes `session: { cartToken, nonce }`. The client stores these and sends them on the next cart request. The server forwards them to WooCommerce and does not invent cart totals.

### Prices

Store API minor units are preserved as `minor` (string). The API adds `major` using `currencyMinorUnit` (ILS = 2). WooCommerce still calculates prices, discounts, shipping, and totals.

## Demo features

Three pages are reached by URL only (not in the header):

- `/studio` is an AI content studio. It drafts Hebrew descriptions, spec bullets, SEO title and meta, and image alt text for real products that have no description, and can rewrite a draft from an instruction. "Apply to store" is a **demo**: the draft is kept in the browser's `localStorage` and the product page shows it behind a demo banner. **Nothing is written to WooCommerce.** Writing to the store needs WooCommerce REST keys with Read/Write permission, which this project does not have.
- `/demand` is the owner's list of sold-out products ranked by how many shoppers asked to be notified. The sign-up form is on every sold-out product page. **Demo:** signups are saved in `server/.data/back-in-stock.json` (git-ignored, it holds email addresses), no email is sent, and the list does not update when a product comes back in stock.
- `/shop-the-look` shows example looks with shoppable pins. The photos are stand-ins taken from live product images; there is no Instagram connection.
- `/influencers/etty` and `/influencers/talia` show an influencer hero and live products from the matching WooCommerce collection. The `?ref=` value is stored in the browser only.

The studio needs these server settings in `.env` (never in a frontend env file):

```text
STUDIO_ACCESS_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.7-flash
```

`STUDIO_ACCESS_KEY` is the owner's access code for `/studio` and `/demand` (sent as the `X-Studio-Key` header; the page asks for it and keeps it until the tab closes). If it is empty the studio routes are open in development and **locked in production**, so set it on any deployed API.

Product photos and names are sent to Google's Gemini API to write the drafts. The studio routes are rate limited and protected by the access code above.

## Tests

```bash
npm test          # unit tests, no network
npm run test:live # hits the live Store API
```

Live tests create a guest cart and add a real product. They do not checkout or pay.

## Blocked

- Grow / Meshulam checkout
- Customer accounts
- Reimplementing Discount Rules, ELEX, Smart Coupons, TM Extra Product Options, Shamor, or PI SOL shipping rules
