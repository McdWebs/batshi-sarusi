# Risks and Uncertainties

These must be resolved **before** implementation of checkout, and several before catalog UI that displays discounts or shipping promises.

---

## Critical (blocks checkout / money)

1. **Grow Wallet headless support**  
   Store API exposes `grow-wallet-payment` only. Checkout uses Grow JS + `admin-ajax.php`. Unknown: iframe vs redirect, 3DS, Bit, webhooks, Store API `POST /checkout` compatibility, PCI.

2. **Meshulam plugin is loaded but not in `payment_methods`**  
   Active vs leftover. Implementing the wrong gateway would take live payments incorrectly.

3. **Do not test real checkout against production** without a written plan. There is no evidenced staging WooCommerce.

4. **Shamor (Shabbat)**  
   If checkout is disabled on Shabbat in Woo, a headless app that always POSTs checkout would violate store policy and confuse customers.

---

## High (wrong prices or shipping)

5. **Discount Rules Pro + ELEX Flexible Pricing + Woo sale_price**  
   Three price engines. Store API returned sale prices, but cart-level rules may still change totals. Express must display **API prices**, never recompute discounts.

6. **Smart Coupons vs Discount Rules vs classic coupons**  
   Cart extension `woocommerce-smart-coupons` is present. Gift-card category may or may not be Smart Coupons. Applying the wrong coupon type will fail at checkout.

7. **Free shipping ₪399**  
   Advertised on every page chrome. A ₪59 cart still paid **₪39 shipping**. Threshold, exclusions (`אין משלוח חינם`), and furniture/courier methods are not fully specified. **Do not hardcode ₪399** in a progress bar until confirmed with live carts at/above threshold.

8. **PI SOL shipping matrix**  
   Six method posts: 14-day ₪39, free variant, ₪39/furniture, ₪100, ₪299/₪499 cash-to-courier. Tag-driven. Headless must only show Store API `shipping_rates`.

9. **TM Extra Product Options**  
   May not serialize through Store API `attributes`. Some SKUs could be un-purchasable headlessly.

10. **Code Snippets**  
    Arbitrary PHP can change cart/checkout. Unknown without admin access.

11. **Pre-orders**  
    Charging now vs later is payment-sensitive.

---

## High (SEO / cutover)

12. **3,400+ product URLs + 167 categories** are Hebrew encoded slugs. Changing to `/product/:id` would destroy SEO.

13. **Name/slug mismatches** (e.g. “כל המוצרים” lives at slug `נבחרי-השבוע`). Naive “pretty” new routes will 404.

14. **`/sitemap.xml` returned 500**; `sitemap_index.xml` works. Fix or replace at cutover.

15. **Page sitemap includes cart, checkout, account, affiliate, home-v2** — duplicate/thin URLs.

16. **`/home-v2/` is a published alternate homepage.** Risk of mixed signals if both stay indexed.

---

## Medium (product experience)

17. **Related / upsell / cross-sell** not in Store API product body. Need REST v3 keys or live without recommendations.

18. **0 featured products, 0 reviews.** Homepage merchandising is Elementor-curated. A naive “featured” query will be empty. Need a WP-managed menu, category, or JetEngine replacement — **not hardcoded product IDs**.

19. **Category explosion:** products sit in many overlapping deal categories. Filters and breadcrumbs will look noisy unless we curate.

20. **Attributes are dirty** (per-product taxonomies like “מגש DANA”). Showing all attributes as shop filters would be unusable.

21. **Empty descriptions / WhatsApp images / empty alt** — PDP content quality is a business issue, not a front-end bug.

22. **Wishlist page may be a stub.**

23. **Accounts / JWT** — no verified headless auth plugin.

24. **CORS:** Store API sends credential CORS headers; origin allow-list unknown. Plan assumes Express proxy (correct).

25. **Wordfence / Cloudflare** may challenge or rate-limit the Express IP.

26. **LiteSpeed** 7-day HTML cache on WP; our API cache must not freeze stock/sale.

27. **WooCommerce POS** shares inventory.

28. **YITH affiliates** cookies must still work after domain/front-end change or affiliates lose commission.

---

## Medium (analytics / legal)

29. **No GTM/GA/Meta IDs in HTML.** Tracking may be consent-gated or missing. Launch without measurement would violate the plan’s analytics requirement — need client IDs.

30. **WPConsent** — new site needs a cookie policy aligned with `/מדיניות-פרטיות/`.

31. **Legal pages** must be reused, not rewritten.

---

## Low / operational

32. Timezone string empty in WP index (`gmt_offset: 0`) while the business is Israel — confirm order timestamps.

33. Taxes all zero — confirm VAT-inclusive display (standard in IL retail).

34. Contact page parse did not yield a phone number (Elementor). Need official WhatsApp/phone from the client.

35. One User-Agent received a homepage 301 injecting IG/Facebook query params — possible marketing plugin; could hurt canonical `/`.

---

## Access we did not have

- WordPress admin / plugin settings screens
- WooCommerce REST consumer keys
- Payment dashboard (Grow/Meshulam)
- Staging site
- Google Search Console / GA4
- Full coupon and discount rule list
- Confirmation that Bit is a separate tender

---

## Recommended verification checklist (client / access)

- [ ] Create REST API keys (read) for staging or production **server**
- [ ] Confirm Grow Store API / headless docs; test one **staging** payment
- [ ] Enable/disable Meshulam explicitly
- [ ] Export shipping rules and free-shipping threshold
- [ ] Export Discount Rules / ELEX / Smart Coupons overview
- [ ] List products using TM Extra Product Options and pre-orders
- [ ] Explain Shamor hours
- [ ] Provide GTM / Pixel IDs
- [ ] Provide WhatsApp Business number
- [ ] Decide fate of `/home-v2/`
- [ ] Confirm affiliate program must survive cutover
