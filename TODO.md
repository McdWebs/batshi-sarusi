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

## Waiting on you

- [ ] Decide on "apply to the real store". It needs WooCommerce REST keys with Read/Write permission (only the store admin can create them) and a go-ahead to build the write code, which was blocked once. The draft files are parked in the session scratchpad, not in the repo.
- [ ] Rotate the Gemini key after the demo (it was pasted into chat). It lives only in the ignored `.env`.
- [x] `proposals/` is committed on the branch by your decision. It contains price floors, so make sure the repo is never shared with the client as is.
- [ ] Decide what to do with `.claude/launch.json` (my preview config): ignore or commit.
- [ ] Push the branch or open a PR when ready.

## Before any public deploy

- [ ] Protect `POST /api/studio/generate`. It is rate limited but has no password, so anyone who can reach the API can spend the Gemini quota.
- [ ] Decide where the studio lives in production (hidden URL, behind a login, or internal tool only).

## Polish

- [ ] Look at `/shop-the-look` and nudge the pin positions in `client/src/content/looks.ts`.
- [ ] Review the generated Hebrew before showing it to the client. Drafts can contain mild filler or unverified claims.
- [ ] Add the three demo pages to the header only if the client should see them.

## Next plan (queued)

- [ ] Analytics and owner dashboard: revenue by influencer and campaign, best sellers, cart abandonment, most-searched out-of-stock products. Needs WooCommerce order access.
- [ ] Back-in-stock capture: a "notify me" button plus a ranked most-wanted out-of-stock list. Needs somewhere to store signups.
- [ ] Bundles ("complete the set") and a free-shipping progress bar. Read the threshold from live shipping data, do not hardcode ₪399.
- [ ] WhatsApp layer: order updates, back-in-stock alerts, abandoned-cart nudges. Paused until Meta business approval.

## Open questions

- [ ] Is the ₪399 free-shipping threshold real, and what is excluded? (not confirmed in the audit)
- [ ] Grow / Meshulam: does either support a headless checkout? (checkout and payments are not built)

## Done

- [x] Pricing memos (headless, full rebuild), feature ideas in English and Hebrew, PDFs, and the `proposals/index.html` navigation page.
- [x] AI content studio API (Gemini, with model fallback) and tests.
- [x] Studio page: before/after view, Google preview, rephrase with an instruction, undo, demo-only apply.
- [x] Shoppable look pages and influencer collection pages.
- [x] Routes and README for the demo features. Committed on the branch.
