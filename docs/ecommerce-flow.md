# E-commerce Customer Journey — Current Store

Mapped from the live site and a **real Store API add-to-cart** (guest). No payment was completed.

```text
Land (homepage / IG / category)
        ↓
Discover (nav, deals, search, filters)
        ↓
Product (gallery, price, variation)
        ↓
Add to cart (classic ajax and/or Store API)
        ↓
Side cart / cart page (coupon, shipping preview)
        ↓
Checkout (Grow SDK) — empty cart redirects back to cart
        ↓
Payment (Grow; Meshulam plugin present)
        ↓
WooCommerce order + WebToffee documents (admin)
        ↓
My Account / order history  (if registered)
```

---

## 1. Landing

- **Organic / direct:** `/` Elementor homepage: announcement (wholesale + 14-day supply), deal modules, category tiles, product cards with SKU and sale prices.
- **Social:** Instagram `@batshi_sarosi`. Homepage HTML can be associated with IG `utm` / `fbclid` (one client saw a 301 adding those params).
- **Alternate landing:** `/home-v2/` “עיצוב חדש”, `/sale/`, `/hot/`, clearance category.

Trust copy already on chrome: **משלוח חינם מעל ₪399**, supply time, wholesale pricing.

---

## 2. Discovery

| Mechanism | How it works today | Headless equivalent |
|---|---|---|
| Curated mega-nav | Elementor/JetMenu — not the raw 167 categories | Curated nav + “all categories” |
| Category archives | Woo `product-category` nested | Store API `category=` |
| Search | JetSearch widget | `GET /products?search=` (281 hits for כוס) |
| Filters | Jet Smart Filters on shop | Attributes: size, color, plus noisy per-product attributes — **do not show empty filters** |
| Deal buckets | Categories like מבצעי כאסח, סטוקים, gift-card prices, influencer lists | Filter `on_sale` and/or those category IDs **from API**, never hardcoded IDs in UI without a WP-managed menu |
| Brands | `/brand/*` | Store API brands |

**Featured products:** API total 0 — homepage “popular” is almost certainly **manual Elementor product widgets or categories**, not Woo `featured`.

---

## 3. Product page

Live PDP (`/product/{slug}/`):

- Images via Jet Woo Product Gallery (Woo media)
- Name, SKU, regular + sale price, Discount Rules scripts
- Add to cart (simple) or variation picker (`pa_צבע`, `pa_גודל-ומידות`, …)
- Stock: `is_in_stock` / Hebrew `קיים במלאי`; 817 SKUs out of stock
- Quantity limits from Store API `add_to_cart.minimum/maximum` (sampled max 2 or 12)
- Pre-order plugin may apply
- TM Extra Product Options may apply on some SKUs
- Related/upsell: **not visible** on sampled page; Store API object has no related fields
- Reviews: none in API

---

## 4. Add to cart

Current site: Woo `add-to-cart.js`, variation script, ELEX ajax add-to-cart, side cart (`xoo-wsc`), cart fragments.

Verified headless path:

```text
GET  /wp-json/wc/store/v1/cart
     → headers Nonce, Cart-Token
POST /wp-json/wc/store/v1/cart/add-item
     { "id": <product or variation id>, "quantity": n }
     → 201 cart payload
```

Variable products must send the **variation id**, not only the parent (parent `has_options: true`).

---

## 5. Cart

- Side cart + `/cart/`
- Coupon field (Woo + Smart Coupons)
- Shipping calculator
- Empty state: “העגלה שלך ריקה”
- Cross-sells: empty on the sampled cart
- Shipping default for a normal housewares SKU: **₪39**, method name **אספקה עד 14 ימי עסקים**
- Pickup: Holon warehouse, scheduled

Free-shipping progress bar (plan §20) is only valid after confirming:

1. Threshold really ₪399
2. Which tags/products are excluded
3. Whether furniture ₪39/item and ₪100/₪299/₪499 rates override

---

## 6. Checkout (high risk — not fully exercised)

1. `/checkout/` with items in cart (empty cart → `/cart/`)
2. Customer fields (Woo standard; country IL)
3. Shipping method selection (PI SOL + pickup)
4. Coupon
5. Payment: Grow Wallet JS (`growPayment.init`); Meshulam assets also loaded
6. Place order → Grow/Meshulam hosted or embedded payment
7. Return URL / order received (not captured in this audit)

Store API `GET /checkout` requires nonce. Express must preserve cart token across this flow.

**Never show success without Woo order + payment confirmation.**

---

## 7. After purchase

- Order in Woo admin
- Invoices/packing slips: WebToffee plugins (admin/email)
- Customer can view `/my-account/orders/`
- Affiliates: YITH may attribute via cookie if the visitor used an affiliate link

---

## 8. Account

- Register / login on `/my-account/`
- Registration is enabled (register form present)
- Lost-password link was **not** clearly found in a quick parse — verify
- Auth for headless is **not** designed yet (Woo session cookie vs application passwords vs JWT plugin — none confirmed)

---

## 9. Exception journeys

| Case | Current | New app |
|---|---|---|
| Out of stock | Sold out on cards (homepage sample) | Use `is_in_stock` |
| Shabbat | Shamor plugin | Must detect closed store |
| Pre-order | Plugin + copy in titles | Only if API exposes status |
| Shipping exception | Product tags | Let Store API rates speak |
| API down | Current site is coupled to WP | Error/empty — **no fake products** |
| Cookie consent | WPConsent | Required if we add pixels |

---

## 10. Measurement gaps

Purchase funnel events in plan.md (`product_view` → `purchase`) are **not evidenced** in first-paint HTML. WPConsent may load GTM later. Implementation of analytics waits on client IDs and a decision to avoid double-firing if the WP site still receives traffic during cutover.
