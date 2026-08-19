# Decisions Log

Decisions below are **audit conclusions**, not a green light to build the full storefront. Implementation starts only after the client confirms the open items.

---

## Locked by `plan.md` (not revisited)

| ID | Decision | Rationale |
|---|---|---|
| D1 | WooCommerce remains source of truth | Client operates the business in WP today |
| D2 | No mock catalog, prices, stock, reviews, orders, or checkout | Live Store API is available |
| D3 | No MongoDB / second product DB in v1 | Sync risk; Woo already stores commerce data |
| D4 | No Woo secrets in the browser | REST v3 is 401 without keys; keys belong on Express |
| D5 | Checkout is a later phase | Payment stack is Grow (+ possible Meshulam), not a simple card field |

---

## Confirmed by this audit

| ID | Decision | Evidence |
|---|---|---|
| D6 | Production origin is `https://batshi-home.co.il` | WP `url` / `home`, sitemaps, Store API |
| D7 | Prefer **Store API v1** for catalog + guest cart | Public 200s; add-item 201 with Nonce + Cart-Token |
| D8 | Use REST **v3 on the server** only when Store API is insufficient | related ids, settings, gateway list, admin reports |
| D9 | Express must proxy cart headers `Nonce` and `Cart-Token` | Required for mutations; checkout 401 without nonce |
| D10 | Keep URL prefixes `/product/`, `/product-category/`, `/brand/` | 3400+ / 167 / 5 indexed URLs |
| D11 | UI language Hebrew RTL, currency ILS | `lang=he-IL`, Store API currency |
| D12 | Do not use JetSearch/JetFilters as the long-term API | Elementor-bound; Store API search/category already work |
| D13 | Do not treat `featured=true` as the homepage merchandising source | Total 0 featured products |
| D14 | Do not show review stars as social proof until reviews exist | Reviews total 0 |
| D15 | Shipping UI must render **live** `shipping_rates` | PI SOL + local pickup returned from cart |
| D16 | Payment integration target is **Grow** until proven otherwise | Only `grow-wallet-payment` on cart |
| D17 | Legal content comes from existing WP pages | Hebrew slugs for terms/privacy/accessibility |
| D18 | `/home-v2/` is not the live homepage | Front page is page 2973 `/` |

---

## Proposed (needs client sign-off)

| ID | Proposal | Why it is still open |
|---|---|---|
| P1 | Headless checkout via Store API + Grow, **or** hybrid: React catalog + Woo `/checkout/` | Grow SDK may require Woo checkout page. Hybrid is safer if Grow has no headless API |
| P2 | Keep Meshulam only if they confirm it is active | Plugin loaded, method id absent |
| P3 | Free-shipping progress uses Store API remaining amount, not a hardcoded 399 | Ad copy vs ₪39 on small cart |
| P4 | Curated navigation stored as a WordPress menu or JetEngine listing, read via authenticated REST or a small config page in WP | Avoid hardcoding category IDs in React |
| P5 | Skip wishlist v1 unless they use the existing page | No wishlist plugin found |
| P6 | Skip native reviews v1 or show empty state only | 0 reviews |
| P7 | Affiliate dashboard stays on WordPress | YITH is a full portal |
| P8 | Analytics via existing GTM after WPConsent-equivalent | IDs not in HTML |
| P9 | Staging: clone WP or use a Grow sandbox before any production payment test | No staging found |
| P10 | Domain cutover only after 1:1 redirects for product + category sitemaps | SEO risk |

---

## Explicitly rejected (for now)

| ID | Rejected idea | Why |
|---|---|---|
| R1 | Mock products to design UI | Violates plan; live catalog is already queryable |
| R2 | Reimplement Discount Rules in TypeScript | Three pricing plugins; logic must stay in Woo |
| R3 | Hardcode shipping ₪39 or free-over-399 | Conditional PI SOL methods + tags |
| R4 | Browser-direct REST v3 with consumer secret | Secret leak |
| R5 | New `/category/:english-slug` without redirects | Would drop 167 URLs |
| R6 | Fake “Only 2 left” / countdown | `low_stock_remaining` is often null; no trustworthy sale end in Store API sample |

---

## Architecture compatibility verdict

**Catalog + search + category browse + guest cart: compatible** with Store API today.

**Checkout + accounts + pixel-perfect discounts + Shabbat + extra options: not verified.**

Per plan §55: **stop here.** Next step is client verification of keys, Grow, shipping threshold, and whether a hybrid checkout (React + Woo checkout) is acceptable for v1.

---

## Suggested next conversation with Batshi (not coding)

1. Woo REST keys + (ideally) staging copy  
2. Grow account owner / developer docs  
3. Is Meshulam used?  
4. Is ₪399 free shipping real, and what is excluded?  
5. Should `/home-v2/` become the new design reference or be ignored?  
6. GTM / WhatsApp number / affiliate must-keep  
7. Approval to begin **Phase 4 backend foundation** (health + products + categories only, no checkout)
