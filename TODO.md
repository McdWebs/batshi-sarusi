# TODO

Working list for the Batshi storefront. Branch: `feature/ai-content-and-instagram`. Last updated 2026-10-04.

## UI work (do in this order, one small task at a time)

### 1. Image loading looks like it is being "printed"

Images appear line by line from the top instead of showing up smoothly. Likely causes to check first: no reserved space or placeholder while loading, no fade-in, large original JPEGs (many are WhatsApp exports) arriving progressively, and lazy loading starting too late.

- [x] Reproduce it and note which pages and which images do it. Every content photo goes through the shared `StoreImage`, so one fix covers all pages. The photos come straight from her WordPress server, and at least one product photo is about 685 KB at card size.
- [x] Reserve the image box and show a calm placeholder colour while loading (`StoreImage` now paints the placeholder itself, cards already had a fixed aspect ratio).
- [x] Fade each image in only after it has fully loaded, in `StoreImage`. In a test run no photo was ever visible while still loading. A photo whose decode stalls is shown after 250 ms anyway.
- [x] First-screen photos load first: `priority` on the first four catalog cards, the product gallery main photo and the first hero slide. Everything else stays lazy.
- [x] Preload the product page's main photo when a card is hovered or focused, using the same `srcset` and `sizes` as the gallery.
- [ ] Look at it yourself on a throttled connection and in a phone-sized window. I could not watch the fade: the Browser pane was hidden, which freezes CSS transitions, so I tested the loading logic with transitions switched off.
- [ ] Heavy source photos (for example a 685 KB card image): resize or compress them at the source, or serve them through an image CDN. The storefront cannot fix files it does not own.

### 2. New UI for four pages (PARKED, decided not to do it for now)

Broad task, so it is split into small steps. Page 4 assumes "item description page" means the product page; confirm if it means something else. Pick it up again only when you say so.

- [ ] 2.0 Pick one simple direction first: spacing, heading and text sizes, button style, card and border style, shared across all four pages. Write it down in a few lines before touching any page.
- [ ] 2.1 Influencer page (`/influencers/:slug`): hero, the share-link box, then the product grid. Fewer boxes, clearer hierarchy, good on phone.
- [ ] 2.2 Shop the look (`/shop-the-look`): look card layout, pin style, and the product popover. Make the pins easy to find and the popover easy to read and tap.
- [ ] 2.3 Studio (`/studio`): second pass on the compare layout, the action buttons (generate, rephrase, apply), and the applied state. Keep it calm, nothing crowded.
- [ ] 2.4 Product / item description page: gallery and title/price block, add to cart, then description, spec bullets and related products. Mobile first.
- [ ] 2.5 Review all four together on phone and desktop for consistency, then fix the differences.

### 3. Skeleton loading for sorting options

Catalog sorting controls flash or jump while product data is still loading. Show a calm skeleton placeholder for the sort UI until the options are ready.

- [ ] Find where the sorting options render (catalog / product grid) and note what they look like before data arrives.
- [ ] Add a skeleton state that matches the sort control layout (same size, no layout shift).
- [ ] Swap to the real sorting options once products / facets are ready.
- [ ] Check it on phone and desktop so the skeleton does not cause a jump when it resolves.

## Site analytics (detailed)

Goal: the owner can see how visitors really use the site: how they move, click, search, sort, filter and buy, and where they give up. It should be detailed, but explained in plain words on a simple dashboard. Today there is no tracking at all (the audit found no GA4, GTM or Meta Pixel IDs). Only the cookie banner and the `?ref=` / source attribution exist.

Order: decide, plan the events, handle privacy, collect, store, then show. Do one small task at a time.

### A. Decide first

- [ ] Choose the approach: (1) our own events sent to our API plus our own owner dashboard, (2) Google Analytics 4 through Tag Manager (the client may already have IDs, ask her), (3) a tool like PostHog, or (1) plus (2) together. Own data gives exactly the views she needs and works with the demand list; GA4 is free and familiar but harder to shape.
- [ ] Decide where events live. `plan.md` says no second database at first, so a real store (for example Postgres, or SQLite for a demo) needs an explicit yes. The back-in-stock JSON file is only a demo and is too weak for this volume.
- [ ] Decide how long raw events are kept (for example 13 months), and whether visitors are identified at all (recommended: anonymous random visitor ID, never name or email).

### B. Plan what to track

Write one list of event names and their fields before coding, so every page tracks the same way. Everything below should be in it:

- [ ] **Movement:** page views (including route changes in the app), entry page, exit page, referrer, UTM and `ref` (influencer), previous page, time on page, scroll depth, session length, new vs returning, device, screen size, language.
- [ ] **Clicks:** header and menu links, hero slides and banners, category cards, product cards (position in the grid), product page photo gallery, quick add, "shop the look" pins and popovers, influencer page links, contact and WhatsApp buttons, footer links, cookie banner choice. Include repeated fast clicks on the same spot (rage clicks) and clicks that do nothing.
- [ ] **Search:** every query, number of results, searches with zero results, which result was clicked and its position, searches that end on an out-of-stock product, searches that were changed or abandoned.
- [ ] **Sorting, filtering and browsing:** which sort option was chosen, which filters, page number or "load more", how deep people scroll in a catalog, which category and collection pages are opened most.
- [ ] **Product pages:** views, variation picked, quantity, add to cart, out-of-stock views, "notify me" opens and signups, reading the description, related product clicks.
- [ ] **Cart and checkout:** add, remove, quantity change, coupon tried (valid or not), shipping option chosen, cart opened, checkout started, which step or field people stop at, errors shown, the free-shipping bar once it exists.
- [ ] **Errors and speed:** failed API calls, failed images, 404 pages, slow loads (page and main image).

### C. Privacy and consent

- [ ] Send nothing until the visitor accepts analytics in the existing cookie banner, and stop when they decline or change their mind.
- [ ] No personal data in events: no email, phone, address or free text typed into forms. For search, check whether queries can contain personal data and cut or mask them if needed.
- [ ] Update the privacy policy text so it says what is collected and for how long (the policy pages come from WordPress; this needs the client's approval).
- [ ] Add a way to delete a visitor's data on request.

### D. Collect

- [ ] A tiny `track(event, details)` helper in the storefront that adds visitor ID, session ID, page, time and device, and queues events.
- [ ] Send events in small batches, and use `sendBeacon` when the page closes so the last events are not lost. Never block or slow the page.
- [ ] `POST /api/events` on the server: validate every field, limit size and rate, drop bots and our own test traffic, never log personal data.
- [ ] Automatic tracking for page views, clicks and scroll, plus explicit calls for search, sort, filters, cart and checkout.

### E. Store

- [ ] Create the events store (whichever was chosen in A) with an index by date and event name, and a daily summary so the dashboard stays fast.
- [ ] A cleanup job for old events, matching the retention period.
- [ ] Backups, and a way to start clean for the demo.

### F. Owner dashboard (plain words, Hebrew, mobile friendly, behind the studio access code)

- [ ] **Overview:** visitors, sessions, pages per visit, orders and conversion, with a date range (today, 7 days, 30 days, custom) and comparison to the previous period.
- [ ] **Where people come from:** Instagram, influencers (by `ref`), direct, search engines, WhatsApp, other sites.
- [ ] **Journey and funnel:** visit, product view, add to cart, checkout, order, with the drop-off at every step and the most common paths between pages.
- [ ] **Products:** most viewed, most added to cart, viewed but never bought, and sold-out products people look at (links to the demand list at `/demand`).
- [ ] **Search:** top searches, searches with no results (lost sales and catalog gaps), searches that end on sold-out products.
- [ ] **Browsing:** which sorting and filters are used, deepest scroll, most used menu items and banners.
- [ ] **Cart and checkout:** abandonment rate, where people stop, coupons tried and failed, shipping choices.
- [ ] **Devices and speed:** mobile vs desktop split, slowest pages, error pages.
- [ ] Export any table to CSV, and short plain-Hebrew explanations next to every number.

### G. Check it

- [ ] Test every event on phone and desktop: it fires once, with the right details, and not twice (no double counting).
- [ ] Test with analytics declined: nothing is sent and nothing is stored.
- [ ] Confirm the dashboard totals against a manual count of a few real sessions.
- [ ] Make sure tracking does not slow the site or break when the tracking API is down.

### H. Needs the client's store

- [ ] Revenue by influencer and campaign, and real order counts, need WooCommerce order access (REST keys). Until then the dashboard can show visits, carts and checkout starts, but not money. This is the same item as "Analytics and owner dashboard" in the next-plan list below.

## Waiting on you

- [ ] Decide on "apply to the real store". It needs WooCommerce REST keys with Read/Write permission (only the store admin can create them) and a go-ahead to build the write code, which was blocked once. The draft files are parked in the session scratchpad, not in the repo.
- [ ] Rotate the Gemini key after the demo (it was pasted into chat). It lives only in the ignored `.env`.
- [x] `proposals/` is committed on the branch by your decision. It contains price floors, so make sure the repo is never shared with the client as is.
- [ ] Decide what to do with `.claude/launch.json` (my preview config): ignore or commit.
- [ ] Push the branch or open a PR when ready.

## Before any public deploy

- [x] Protect the studio routes. `/api/studio/*` now needs an access code (`STUDIO_ACCESS_KEY` in `.env`, header `X-Studio-Key`) and is locked in production if the code is not set. The owner types the code once per tab.
- [ ] Set `STUDIO_ACCESS_KEY` on the deployed API, and give the owner the code (read it from `.env`; it was generated for this demo, change it any time).
- [ ] Decide where the studio lives in production (hidden URL, behind a login, or internal tool only). The access code is a simple gate, not per-user accounts.

## Polish

- [ ] Look at `/shop-the-look` and nudge the pin positions in `client/src/content/looks.ts`.
- [ ] Review the generated Hebrew before showing it to the client. Drafts can contain mild filler or unverified claims.
- [ ] Add the three demo pages to the header only if the client should see them.

## Next plan (queued)

- [ ] Analytics and owner dashboard: revenue by influencer and campaign, best sellers, cart abandonment, most-searched out-of-stock products. Needs WooCommerce order access. The full breakdown is in "Site analytics (detailed)" above.
- [ ] Back-in-stock for real: the demo is built (see Done). A real launch needs a proper store for signups instead of the JSON file, a mail provider to send the notification, a rule for when a product counts as back in stock, and consent wording for collecting emails.
- [ ] Bundles ("complete the set") and a free-shipping progress bar. Read the threshold from live shipping data, do not hardcode ₪399.
- [ ] WhatsApp layer: order updates, back-in-stock alerts, abandoned-cart nudges. Paused until Meta business approval.

## Open questions

- [ ] Does the client already have a GA4 property, Tag Manager container or Meta Pixel? If yes, which IDs? (Needed for the analytics approach.)
- [ ] Analytics: own tracking and dashboard, GA4, or both? (see "Site analytics", section A)
- [ ] Is the ₪399 free-shipping threshold real, and what is excluded? (not confirmed in the audit)
- [ ] Grow / Meshulam: does either support a headless checkout? (checkout and payments are not built)

## Done

- [x] Pricing memos (headless, full rebuild), feature ideas in English and Hebrew, PDFs, and the `proposals/index.html` navigation page.
- [x] AI content studio API (Gemini, with model fallback) and tests.
- [x] Studio page: before/after view, Google preview, rephrase with an instruction, undo, demo-only apply.
- [x] Shoppable look pages and influencer collection pages.
- [x] Routes and README for the demo features. Committed on the branch.
- [x] Image loading fix, TODO file and proposals. Committed on the branch.
- [x] Studio access code on every `/api/studio` route, with a form on `/studio` and `/demand`. Committed on the branch.
- [x] Back-in-stock demo: "notify me" form on sold-out product pages and the owner's ranked list at `/demand`. Signups go to `server/.data/back-in-stock.json`, no email is sent. Committed on the branch.
