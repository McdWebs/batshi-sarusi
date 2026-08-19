# Batshi Home — Headless WooCommerce Storefront
## Complete Cursor Implementation Plan

> **Goal:** Replace the customer-facing Batshi Home storefront with a modern, high-converting React application while preserving the existing WordPress/WooCommerce operation as the source of truth.
>
> **Critical requirement:** This project uses **LIVE production data only**. No mock catalog, fake products, fake prices, placeholder products, demo orders, simulated checkout, or hardcoded business data may be introduced.

---

# 0. PROJECT OBJECTIVE

Build a production-ready headless e-commerce storefront for Batshi Home.

The existing WordPress + WooCommerce installation remains responsible for the business operation.

The new application becomes the customer-facing storefront.

### Existing system

```text
WordPress
└── WooCommerce
    ├── Products
    ├── Categories
    ├── Variations
    ├── Prices
    ├── Sale prices
    ├── Inventory
    ├── Customers
    ├── Orders
    ├── Coupons
    ├── Shipping
    ├── Payment integrations
    └── Existing WooCommerce plugins
```

### New system

```text
Customer
   ↓
React + Vite storefront
   ↓
Node + Express API layer
   ↓
WooCommerce APIs
   ↓
Existing WordPress/WooCommerce infrastructure
```

The client should continue managing the store through WordPress/WooCommerce without needing to learn the new frontend technology.

---

# 1. NON-NEGOTIABLE RULES

These rules apply to the entire project.

## 1.1 NO MOCK DATA

NEVER create:

- mock products
- fake products
- fake categories
- fake prices
- fake stock
- fake reviews
- fake orders
- fake customers
- fake coupons
- fake shipping options
- fake payment confirmation
- fake product images
- demo catalog JSON
- placeholder catalog arrays

Every customer-visible piece of commerce data must come from the live WooCommerce installation.

If the API is unavailable, display a proper error/loading/empty state.

**Never silently fall back to fake data.**

---

## 1.2 WOOCOMMERCE IS THE SOURCE OF TRUTH

Do not duplicate the entire WooCommerce database.

WooCommerce remains authoritative for:

- products
- variations
- prices
- sale prices
- stock
- categories
- attributes
- product images
- reviews
- coupons
- cart
- shipping
- checkout
- customers
- orders

The React application consumes this data.

---

## 1.3 DO NOT INTRODUCE MONGODB INITIALLY

Do NOT create a database just because the project contains Node/Express.

A second database creates synchronization problems.

Only introduce a database later if a clearly defined custom feature requires persistent data that WooCommerce cannot reasonably own.

---

## 1.4 NO HARDCODED BUSINESS DATA

Do not hardcode:

```text
product names
prices
category names
product IDs
stock levels
shipping prices
discount percentages
coupon codes
```

Configuration such as API URLs, feature flags and environment variables is allowed.

---

# 2. TECHNOLOGY STACK

## Frontend

- React
- TypeScript
- Vite
- React Router
- MUI
- TanStack Query
- Axios
- Zod
- Zustand only when necessary

## Backend

- Node.js
- Express
- TypeScript
- Axios
- Zod
- dotenv
- structured logging
- centralized error handling

## Infrastructure

- Frontend: Vercel
- Backend: Render or equivalent Node hosting
- Existing WordPress/WooCommerce hosting remains unchanged

Do not migrate WordPress/WooCommerce unless explicitly required.

---

# 3. PHASE 0 — CURRENT SITE AUDIT

Before writing the new UI, inspect the current Batshi Home website and document how the existing store works.

Create:

```text
docs/
├── architecture.md
├── current-site-audit.md
├── api-inventory.md
├── integration-map.md
├── route-map.md
├── ecommerce-flow.md
├── risks.md
└── decisions.md
```

## Audit the following

### Product system

Determine:

- product endpoint
- variable products
- variations
- attributes
- categories
- tags
- sale products
- featured products
- stock status
- images
- product descriptions
- short descriptions
- SKU
- pricing
- related products
- upsells
- cross-sells
- reviews

### Shopping experience

Document:

- homepage
- category pages
- product listing
- product page
- search
- filters
- sorting
- pagination
- cart
- coupons
- checkout
- login
- registration
- customer account
- order history
- wishlist if present
- gift cards if present
- product options if present

### Business integrations

Investigate:

- payment provider
- shipping provider
- inventory systems
- ERP
- CRM
- WhatsApp
- email
- marketing automation
- analytics
- Meta Pixel
- Google Analytics
- Google Tag Manager
- Google Search Console
- review system
- loyalty/VIP system
- coupon system

### WooCommerce plugins

Identify plugins that affect customer-facing behavior.

For each plugin record:

```text
Plugin
Purpose
Affected functionality
API available?
Requires frontend integration?
Requires backend integration?
Risk
```

Do not assume standard WooCommerce behavior if a plugin changes it.

---

# 4. PHASE 1 — API DISCOVERY

Determine exactly which APIs the existing installation exposes.

Prefer WooCommerce Store API for customer-facing functionality where appropriate.

Use WooCommerce REST API or authenticated backend integrations when Store API is insufficient.

Document every endpoint used.

Example:

```text
GET    /api/products
GET    /api/products/:id
GET    /api/categories
GET    /api/search
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:key
DELETE /api/cart/items/:key
POST   /api/cart/coupon
DELETE /api/cart/coupon
GET    /api/cart/shipping-rates
POST   /api/checkout
```

Exact routes should be determined from the real WooCommerce installation.

Do not invent endpoint behavior.

---

# 5. PHASE 2 — REPOSITORY STRUCTURE

Create a clean production structure:

```text
batshi-storefront/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── theme/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│   │
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── integrations/
│   │   │   └── woocommerce/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   └── package.json
│
├── docs/
├── .env.example
├── README.md
└── package.json
```

---

# 6. PHASE 3 — ENVIRONMENT CONFIGURATION

Create environment variables.

Frontend:

```text
VITE_API_BASE_URL=
VITE_SITE_URL=
```

Backend:

```text
PORT=
WOOCOMMERCE_BASE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
WOOCOMMERCE_API_VERSION=
CORS_ORIGIN=
```

Never expose WooCommerce consumer secrets to the browser.

Never commit secrets.

Create:

```text
.env.example
```

with empty values.

---

# 7. PHASE 4 — BACKEND FOUNDATION

Build Express first.

Requirements:

- TypeScript
- environment validation
- CORS
- security headers
- request logging
- centralized errors
- request validation
- timeout handling
- WooCommerce API client
- consistent response format

Create:

```text
server/src/integrations/woocommerce/
├── client.ts
├── products.ts
├── categories.ts
├── cart.ts
├── checkout.ts
├── customers.ts
└── types.ts
```

Do not allow React components to directly know WooCommerce implementation details.

---

# 8. PHASE 5 — PRODUCT DATA LAYER

Implement live product access.

Support:

- pagination
- category
- search
- sorting
- price range
- attributes
- stock
- sale status
- featured products
- product IDs
- SKU
- variations
- related products

Build normalized TypeScript types:

```text
Product
ProductVariation
ProductCategory
ProductImage
ProductAttribute
ProductReview
```

The frontend should consume normalized application types rather than WooCommerce response shapes everywhere.

---

# 9. PHASE 6 — CATEGORY SYSTEM

Build category navigation dynamically from WooCommerce.

Requirements:

- top-level categories
- nested categories
- category counts where available
- category images where available
- dynamic category pages
- no hardcoded category lists

Create:

```text
/categories/:slug
```

and appropriate nested routes.

---

# 10. PHASE 7 — SEARCH

Build proper site-wide search.

Requirements:

- live WooCommerce products
- debounce
- search suggestions
- product results
- category results where useful
- no-results state
- mobile search
- keyboard accessibility

Search should not require loading the entire catalog into the browser.

---

# 11. PHASE 8 — FILTERING AND SORTING

Implement filters based on real WooCommerce product attributes.

Support whatever the live catalog exposes, including where applicable:

- price
- category
- brand
- color
- size
- material
- availability
- attributes

Sorting:

- relevance
- newest
- price low-high
- price high-low
- popularity
- featured

Do not display filters that do not exist in the real catalog.

---

# 12. PHASE 9 — DESIGN SYSTEM

Create a complete Batshi design system.

Do not copy the current site's visual structure.

The new design should feel like a modern Israeli retail brand.

## Design principles

### Product-first

Products should dominate the visual hierarchy.

### Deal-first

The strongest discounts should be immediately understandable.

### Clean

Avoid visual clutter despite the large catalog.

### Mobile-first

Design mobile deliberately rather than shrinking desktop layouts.

### Fast

Avoid unnecessary animation, huge images and excessive JavaScript.

---

# 13. HEADER

Build:

- announcement bar
- logo
- search
- account
- cart
- navigation
- category menu
- mobile navigation

The header should remain simple.

Do not expose the entire WooCommerce category tree at once.

Create a curated customer-facing navigation structure while preserving access to the full catalog.

---

# 14. HOMEPAGE

The homepage should be built entirely from live WooCommerce data.

Do not invent products.

Recommended structure:

```text
Announcement
↓
Hero / primary promotion
↓
Today's Deals
↓
Best Sellers
↓
Shop by Category
↓
Popular Products
↓
Products by price range
↓
New Arrivals
↓
Seasonal / promotional products
↓
Trust / shipping information
↓
Newsletter / WhatsApp CTA
↓
Footer
```

Every product shown must be retrieved from WooCommerce.

Do not hardcode product IDs unless the client explicitly chooses a merchandising configuration mechanism later.

---

# 15. DEALS SYSTEM

Use real WooCommerce sale data.

Create dynamic sections such as:

- Sale
- Best Sellers
- Featured
- New
- Popular
- Last Chance if data supports it

Do not fake urgency.

Never display:

```text
Only 2 left
Sale ends in 02:31
```

unless the backend provides trustworthy data supporting that statement.

---

# 16. PRODUCT CARD

Create a premium reusable ProductCard.

It should support:

- image
- hover image
- product name
- price
- regular price
- sale price
- discount percentage
- stock status
- badges
- quick add
- wishlist if supported
- variation selection where necessary

Example:

```text
PRODUCT IMAGE

SALE
-35%

Product name

₪129
₪199

[Add to cart]
```

All values are dynamic.

---

# 17. PRODUCT PAGE

Build a high-converting product page.

Above the fold:

- image gallery
- product name
- price
- original price
- sale price
- discount
- SKU where useful
- availability
- variations
- quantity
- add to cart
- shipping information
- returns information

Below:

- description
- specifications
- attributes
- reviews
- related products
- upsells
- cross-sells

Do not invent product information.

---

# 18. PRODUCT IMAGE SYSTEM

Use the images already stored in WooCommerce.

Requirements:

- responsive images
- lazy loading
- correct aspect ratio
- optimized display
- image gallery
- zoom where useful
- keyboard accessible gallery

Never download and duplicate the entire product catalog unnecessarily.

---

# 19. CART

Build a real WooCommerce-backed cart.

Requirements:

- add product
- remove product
- change quantity
- variation selection
- coupon
- subtotal
- discount
- shipping
- total
- free-shipping progress
- related product suggestions

Cart state must persist correctly.

Never implement a fake local-only cart.

---

# 20. FREE SHIPPING PROGRESS

If the existing WooCommerce configuration supports a free-shipping threshold, surface it dynamically.

Example:

```text
₪280 / ₪399

חסרים ₪119 למשלוח חינם
```

When threshold is reached:

```text
✓ הגעת למשלוח חינם
```

The threshold must come from actual store configuration where possible.

Do not hardcode business rules without confirming them.

---

# 21. CHECKOUT

This is a HIGH-RISK phase.

Do not implement checkout until the existing payment/shipping flow has been fully audited.

The checkout must use the real WooCommerce checkout system and existing supported payment infrastructure.

Support, as applicable:

- customer details
- address
- phone
- email
- shipping method
- payment
- coupons
- order notes
- terms
- final order total

Never simulate successful payment.

Never create fake order confirmation.

Only show success after WooCommerce confirms the real order/payment state.

---

# 22. PAYMENT INTEGRATION

Identify the existing payment gateway before implementing checkout.

Determine:

- gateway
- tokenization
- redirect requirements
- iframe requirements
- 3DS
- callback/webhook requirements
- supported WooCommerce integration
- PCI implications

Do not store card information.

Do not attempt to reproduce payment processing independently unless the provider explicitly supports the architecture.

---

# 23. SHIPPING

Integrate with the existing WooCommerce shipping configuration.

Support:

- available shipping methods
- price
- delivery information
- pickup if available
- address-dependent shipping
- shipping selection

Never hardcode shipping costs.

---

# 24. CUSTOMER ACCOUNTS

If the existing store supports customer accounts, reproduce the useful functionality:

- login
- registration
- logout
- account details
- addresses
- order history
- order details

Authentication architecture must be determined from the existing WooCommerce setup.

Do not invent a parallel customer database.

---

# 25. REVIEWS

If reviews are enabled:

- load real reviews
- display real ratings
- show rating breakdown where available
- allow review submission if the current system supports it

Never create fake reviews.

Never create fake review counts.

---

# 26. SEO

Because this is a large e-commerce catalog, SEO is a major concern.

Implement:

- semantic HTML
- dynamic page titles
- meta descriptions
- canonical URLs
- Open Graph
- structured product data
- breadcrumb schema
- product schema
- organization schema where appropriate
- sitemap strategy
- robots strategy
- clean URLs

Do not accidentally create duplicate URLs for the same product.

Preserve existing valuable URLs where possible.

Create redirects when routes change.

---

# 27. PERFORMANCE

Target:

- fast initial render
- optimized images
- code splitting
- lazy loading
- caching
- minimal client-side JavaScript
- minimal unnecessary API calls

Use TanStack Query for server-state caching.

Do not load thousands of products at once.

Use pagination/infinite loading appropriately.

---

# 28. MOBILE UX

Treat mobile as a first-class experience.

Implement:

- mobile header
- mobile search
- mobile navigation
- sticky add-to-cart where appropriate
- touch-friendly filters
- bottom-sheet filters
- optimized product gallery
- fast cart
- mobile checkout

Test at minimum:

```text
320px
375px
390px
430px
tablet
desktop
```

---

# 29. ACCESSIBILITY

Implement:

- keyboard navigation
- semantic elements
- proper labels
- accessible buttons
- focus states
- alt text from product data
- color contrast
- screen-reader-friendly errors
- accessible dialogs/drawers

Do not sacrifice accessibility for visual effects.

---

# 30. ANALYTICS

Do not launch without analytics.

Track:

```text
page_view
product_view
search
category_view
add_to_cart
remove_from_cart
view_cart
begin_checkout
shipping_selected
payment_started
purchase
coupon_applied
```

Use the existing analytics infrastructure where possible.

Do not double-count purchases.

The purchase event must correspond to a real WooCommerce order.

---

# 31. CONVERSION OPTIMIZATION

Build the UI around measurable business metrics.

Primary metrics:

- conversion rate
- revenue per visitor
- average order value
- cart abandonment
- checkout completion
- repeat purchases
- product engagement

Features to test later:

### Product recommendations

Use WooCommerce-related products, upsells and cross-sells where available.

### Bundles

Only introduce dynamic bundles after determining whether WooCommerce already has bundle functionality.

### Free shipping progress

Use actual store rules.

### Recently viewed

Can be client-side if appropriate.

### Wishlist

Only implement if the existing business supports it or the client explicitly approves a new system.

### Exit intent

Do not spam customers.

---

# 32. ADMIN / MERCHANDISING PRINCIPLE

The client should NOT have to maintain the React application manually.

If she changes:

```text
product
price
image
stock
category
sale
description
```

the new storefront should automatically reflect it.

That is one of the primary selling points.

---

# 33. ERROR STATES

Every API-driven page needs:

### Loading

Skeletons appropriate to the content.

### Empty

Example:

```text
לא מצאנו מוצרים שמתאימים לחיפוש.
```

### Error

Example:

```text
משהו השתבש.
נסו שוב בעוד רגע.
```

Provide retry.

Never display fabricated products to hide an API failure.

---

# 34. SECURITY

Implement:

- HTTPS
- secure environment variables
- CORS restrictions
- rate limiting
- input validation
- output validation
- no WooCommerce secrets in frontend
- no card storage
- secure cookies where applicable
- security headers
- dependency auditing

Do not expose administrative WooCommerce credentials.

---

# 35. CACHING

Cache appropriate read-only data:

- categories
- product listings
- product details
- promotional data

Do NOT incorrectly cache:

- customer-specific cart
- checkout
- payment state
- private customer data

Use short stale times for rapidly changing product/stock information.

---

# 36. TESTING

Create tests for:

### Unit

- price calculations
- discount calculations
- API normalization
- filters
- cart transformations
- validation

### Integration

- product API
- categories
- cart
- coupon
- shipping
- checkout

### E2E

Test real flows against an appropriate staging environment:

```text
Browse product
↓
Open product
↓
Select variation
↓
Add to cart
↓
Change quantity
↓
Apply coupon
↓
Select shipping
↓
Checkout
↓
Payment
↓
Order confirmation
```

Do not run destructive tests against production unless explicitly controlled.

---

# 37. STAGING ENVIRONMENT

Before production launch:

```text
Development
    ↓
Staging WooCommerce
    ↓
Staging frontend
    ↓
Realistic test transactions
    ↓
Production
```

If a staging WooCommerce environment does not exist, create a safe plan with the client before testing checkout.

Never test fake success logic and call it production-ready.

---

# 38. MIGRATION / URL STRATEGY

Before replacing the current frontend:

Inventory current URLs.

Important:

- homepage
- categories
- products
- sale pages
- informational pages
- legal pages
- blog pages
- account pages

For every changed URL:

```text
old URL → new URL
```

Create redirects where appropriate.

Do not destroy existing SEO equity.

---

# 39. LEGAL / TRUST PAGES

Preserve or recreate:

- terms
- privacy
- accessibility
- shipping
- returns
- contact
- cancellation policy

Do not rewrite legal terms casually.

Use the existing business-approved legal content unless the client/legal advisor explicitly provides replacements.

---

# 40. FOOTER

Include:

- categories
- customer service
- shipping
- returns
- contact
- legal
- social links
- newsletter/WhatsApp where applicable

Keep it clean.

---

# 41. VISUAL DIRECTION

The design should NOT be:

```text
Generic MUI dashboard
Generic SaaS layout
Generic WooCommerce template
```

Avoid:

- excessive cards
- excessive borders
- generic red CTA everywhere
- huge text blocks
- unnecessary gradients
- template-like sections

Aim for:

- editorial retail
- strong photography
- generous whitespace
- confident typography
- clear pricing
- strong deal hierarchy
- restrained UI
- premium product presentation

The website should feel like a serious Israeli home retailer, not a developer demo.

---

# 42. DESIGN SYSTEM COMPONENTS

Create reusable components:

```text
AppShell
Header
AnnouncementBar
DesktopNav
MobileNav
Search
MegaMenu
Breadcrumbs
ProductCard
ProductGrid
ProductGallery
Price
DiscountBadge
SaleBadge
StockBadge
CategoryCard
CategoryGrid
FilterDrawer
SortMenu
Pagination
CartDrawer
CartItem
CouponInput
ShippingProgress
CheckoutForm
OrderSummary
ReviewSection
RecommendationSection
Footer
ErrorState
EmptyState
LoadingState
```

Avoid duplicated markup.

---

# 43. ROUTING

Build routes based on the real store structure.

At minimum:

```text
/
 /shop
 /category/:slug
 /product/:slug
 /search
 /sale
 /cart
 /checkout
 /account
 /account/orders
 /account/orders/:id
 /login
 /register
 /contact
 /shipping
 /returns
 /terms
 /privacy
```

Adjust based on the current site audit.

Do not create routes that have no real business purpose.

---

# 44. STATE MANAGEMENT

Use TanStack Query for:

- products
- categories
- search
- product details
- reviews
- WooCommerce server state

Use Zustand only for genuinely client-owned state such as:

- UI preferences
- temporary UI state
- non-server interactions

Do not duplicate WooCommerce server state in Zustand.

---

# 45. API ERROR CONTRACT

Backend should return consistent errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "WOOCOMMERCE_UNAVAILABLE",
    "message": "Store service temporarily unavailable"
  }
}
```

Never leak internal credentials or stack traces.

---

# 46. OBSERVABILITY

Add:

- request logs
- API error logs
- checkout error logs
- WooCommerce integration errors
- frontend error boundary
- production error monitoring

The goal is to know when the store breaks before the client discovers it.

---

# 47. PRODUCTION DEPLOYMENT

## Frontend

Deploy to Vercel.

Configure:

- production domain
- environment variables
- redirects
- caching
- build configuration

## Backend

Deploy Node/Express to Render or equivalent.

Configure:

- environment variables
- CORS
- production logging
- health endpoint
- monitoring

## Health endpoint

```text
GET /health
```

Return:

```json
{
  "status": "ok"
}
```

Do not expose sensitive configuration.

---

# 48. DOMAIN CUTOVER

Do not switch DNS immediately.

First:

1. Deploy staging.
2. Test all functionality.
3. Deploy production frontend.
4. Connect production WooCommerce.
5. Run smoke tests.
6. Verify analytics.
7. Verify checkout.
8. Verify payment.
9. Verify shipping.
10. Verify SEO.
11. Verify redirects.
12. Verify mobile.
13. Switch domain.
14. Monitor aggressively.

---

# 49. LAUNCH CHECKLIST

## Commerce

- [ ] Products load from WooCommerce
- [ ] Categories load from WooCommerce
- [ ] Prices are live
- [ ] Sale prices are live
- [ ] Stock is live
- [ ] Variations work
- [ ] Cart works
- [ ] Coupons work
- [ ] Shipping works
- [ ] Checkout works
- [ ] Payment works
- [ ] Orders appear in WooCommerce
- [ ] Customer accounts work
- [ ] Order history works

## UX

- [ ] Desktop
- [ ] Mobile
- [ ] Tablet
- [ ] Search
- [ ] Filters
- [ ] Sorting
- [ ] Product pages
- [ ] Cart
- [ ] Checkout
- [ ] Error states
- [ ] Empty states
- [ ] Loading states

## SEO

- [ ] Titles
- [ ] Meta descriptions
- [ ] Canonicals
- [ ] Structured data
- [ ] Sitemap
- [ ] Robots
- [ ] Redirects
- [ ] Existing URLs mapped

## Analytics

- [ ] GA4
- [ ] GTM
- [ ] Meta
- [ ] Product views
- [ ] Add to cart
- [ ] Checkout
- [ ] Purchase
- [ ] Revenue
- [ ] No duplicate purchase events

## Security

- [ ] Secrets protected
- [ ] CORS restricted
- [ ] HTTPS
- [ ] Validation
- [ ] Rate limiting
- [ ] Security headers
- [ ] No payment data stored

---

# 50. ACCEPTANCE CRITERIA

The project is NOT complete until all of the following are true.

### Data

Every product displayed comes from live WooCommerce.

### Administration

A store administrator can change a product in WooCommerce and the new storefront eventually reflects the change without editing React code.

### Cart

Adding an item creates a real WooCommerce cart state.

### Checkout

Checkout creates a real WooCommerce order.

### Payment

Payment uses the existing approved payment infrastructure.

### Inventory

The storefront respects actual WooCommerce availability.

### No fake data

Searching, browsing, filtering and recommendations never fall back to invented products.

### Failure handling

If WooCommerce goes down, users receive a useful error state rather than fake content.

### Performance

The site is fast on mobile and does not load the entire catalog unnecessarily.

### SEO

Existing valuable URLs are preserved or redirected.

### Analytics

The business can measure the complete funnel from visitor → product → cart → checkout → purchase.

---

# 51. DEVELOPMENT ORDER

Do NOT build everything simultaneously.

Follow this exact sequence:

## Step 1 — Audit

Inspect current Batshi/WooCommerce functionality.

Output:

```text
docs/current-site-audit.md
docs/api-inventory.md
docs/integration-map.md
docs/route-map.md
```

## Step 2 — Architecture

Confirm:

```text
React/Vite
+
Express
+
WooCommerce
```

and explicitly document why no database is required initially.

## Step 3 — Backend connection

Successfully retrieve real:

- products
- categories
- product details

before designing the full application.

## Step 4 — Frontend shell

Build:

- theme
- routing
- header
- footer
- layout

## Step 5 — Catalog

Build:

- category pages
- product listing
- search
- filtering
- sorting
- pagination

## Step 6 — Product pages

Build complete live product experience.

## Step 7 — Cart

Implement real WooCommerce cart.

## Step 8 — Checkout

Only after payment/shipping integrations are understood.

## Step 9 — Customer account

Implement if existing infrastructure supports it.

## Step 10 — SEO

Implement dynamic metadata, structured data and redirects.

## Step 11 — Analytics

Implement complete e-commerce funnel tracking.

## Step 12 — Performance

Optimize images, caching, API requests and bundles.

## Step 13 — Testing

Run complete end-to-end testing against staging.

## Step 14 — Production

Deploy and perform controlled domain cutover.

---

# 52. CURSOR DEVELOPMENT RULES

When working in Cursor:

### Rule 1

Never create mock data to unblock UI development.

If live data is not available yet, build the API integration first.

### Rule 2

Never silently swallow API failures.

### Rule 3

Never duplicate WooCommerce business logic unnecessarily.

### Rule 4

Never put WooCommerce secrets in the frontend.

### Rule 5

Never create a second product database without an explicit architectural reason.

### Rule 6

Never hardcode product IDs, prices or categories for convenience.

### Rule 7

Never implement fake checkout behavior.

### Rule 8

Do not rewrite working functionality without understanding the existing plugin/integration that provides it.

### Rule 9

Every major feature must be tested against real WooCommerce data.

### Rule 10

Prefer reusable components and services over duplicated implementation.

---

# 53. DEFINITION OF DONE

The project is complete when Batshi can continue operating her store through WordPress/WooCommerce exactly as before while customers experience the new storefront.

The ideal workflow is:

```text
BATSHI ADMIN
     │
     ▼
WordPress / WooCommerce
     │
     ├── Add product
     ├── Change price
     ├── Change image
     ├── Change stock
     ├── Create sale
     ├── Manage order
     └── Manage customer
             │
             ▼
      WooCommerce APIs
             │
             ▼
       NEW REACT STORE
             │
             ▼
         CUSTOMER
```

The administrator should not care that the frontend is React.

The customer should not care that the backend is WordPress.

That separation is the entire point of the architecture.

---

# 54. FINAL BUSINESS OBJECTIVE

Do not optimize the project for:

> "The new site looks better."

Optimize it for:

```text
More revenue per visitor
        +
Higher conversion rate
        +
Higher average order value
        +
Lower checkout abandonment
        +
Better mobile experience
        +
Better product discovery
        +
Better measurement
```

The visual redesign is the visible part.

The actual product is a **new customer-facing commerce experience backed by the existing WooCommerce business infrastructure.**

---

# 55. FIRST CURSOR TASK

Do NOT start coding the full website yet.

Start by performing the audit.

Cursor's first task should be:

> **Inspect the existing Batshi Home website and determine exactly how its WooCommerce-powered customer experience currently works. Do not generate mock data. Do not create the new UI yet. Produce the audit documents listed above, identify the available WooCommerce APIs, identify potential plugins/integrations, map the current customer journey, identify SEO-critical URLs, and list every technical uncertainty that must be resolved before implementation.**
>
> **After the audit is complete, stop. Do not proceed to implementation until the architecture and API compatibility have been verified.**

Only after that audit should implementation begin.