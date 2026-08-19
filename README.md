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
