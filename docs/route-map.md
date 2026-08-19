# Route Map — Current URLs (SEO-critical)

Preserve these patterns unless Batshi explicitly accepts redirects. Slugs are **Hebrew** and percent-encoded in the address bar.

**Host:** `https://batshi-home.co.il`

---

## 1. Core commerce

| Current URL | Purpose | Notes |
|---|---|---|
| `/` | Homepage (page 2973) | Front page. Heavy Elementor. JSON-LD WebPage |
| `/shop/` | Full catalog | In product sitemap as first URL |
| `/product/{slug}/` | Product | 3400+ URLs across `product-sitemap.xml` … `product-sitemap4.xml` |
| `/product-category/{path}/` | Category archive | **167** URLs, nested up to 3+ segments |
| `/brand/{slug}/` | Brand archive | 5 brands (see below) |
| `/cart/` | Cart | In page sitemap (consider noindex on new site) |
| `/checkout/` | Checkout | Empty cart **redirects to `/cart/`** |
| `/my-account/` | Login / account | |
| `/my-account/orders/` | Order history | Login required |
| `/my-account/orders/{id}/` | Order detail | Standard Woo (not separately crawled) |

### Brand URLs (sitemap)

- `/brand/benetton/`
- `/brand/cucina-mia-איטליה/`
- `/brand/food-appeal/`
- `/brand/pip-studio/`
- `/brand/דגם-הרמס/`

---

## 2. Published pages (WP)

| URL | Title |
|---|---|
| `/` | בתשי הום – הכול לבית |
| `/home-v2/` | בתשי הום – עיצוב חדש (**do not replace `/` without a decision**) |
| `/sale/` | מבצע יומי |
| `/hot/` | המומלצים של בתשי |
| `/אודות/` | אודות |
| `/צור-קשר/` | צור קשר |
| `/תקנון-אתר/` | תקנון אתר |
| `/מדיניות-פרטיות/` | מדיניות פרטיות |
| `/הצהרת-נגישות/` | הצהרת נגישות |
| `/רשימת-המשאלות-שלי/` | Wishlist page (plugin unverified) |
| `/affiliate-dashboard/` | YITH affiliate |

English aliases `/contact/`, `/privacy/`, `/terms/`, `/shipping/`, `/returns/`, `/wishlist/` return **404**. Legal URLs are Hebrew slugs.

---

## 3. Top-level product categories (live counts)

These are `parent=0` categories from Store API (count = products assigned, overlapping):

| Count | Name | Path (decoded) |
|---|---|---|
| 3175 | כל המוצרים שלנו | `/product-category/נבחרי-השבוע/` *(slug `נבחרי-השבוע` — name/slug mismatch)* |
| 2113 | ראש השנה 2026 | `/product-category/שבועות-2026/` *(slug mismatch vs name)* |
| 2088 | מבצעי כאסח | `/product-category/בלק-פריידיי/` |
| 2057 | הטבות ומבצעים | `/product-category/מבצעים/` |
| 1353 | בישול, מטבח ואפייה | `/product-category/בישול-מטבח-ואפייה/` |
| 1246 | כלי הגשה ואירוח | `/product-category/כלי-הגשה-ואירוח/` |
| 1003 | טקסטיל ועיצוב הבית | `/product-category/טקסטיל-ועיצוב-הבית/` |
| 984 | אחסון וארגון | `/product-category/אחסון-וארגון-2/` |
| 573 | חגים ושבתות | `/product-category/חגים-ושבתות/` |
| 474 | אחרונים במלאי – חיסול | `/product-category/clearance/` |
| 310 | כוסות וקנקנים | `/product-category/כוסות-בישול-ומטבח/` |
| 275 | שולחן השבת שלי השבוע | `/product-category/שולחן-השבת-שלי-השבוע/` |
| 263 | סידור הבית | `/product-category/סידור-הבית/` |
| 225 | Uncategorized | `/product-category/uncategorized/` |
| 169 | שונות | `/product-category/שונות/` |
| 114 | המומלצים של טליה סול | `/product-category/המומלצים-של-טליה/` |
| 80 | פחי אשפה | `/product-category/פחי-אשפה/` |
| 56 | מוצרי חשמל | `/product-category/מוצרי-חשמל/` |
| 36 | BENETTON | `/product-category/benetton/` |
| 20 | קולקציית פיפ סטודיו 2026 | `/product-category/קולקציית-פיפ-סטודיו-2026/` |

**SEO warning:** several display names do not match slugs (`כל המוצרים` vs `נבחרי-השבוע`, `ראש השנה 2026` vs `שבועות-2026`, `מבצעי כאסח` vs `בלק-פריידיי`). Redirects must use **actual slugs**, not translated names.

Nested example (cooking):

```text
/product-category/בישול-מטבח-ואפייה/
/product-category/בישול-מטבח-ואפייה/אביזרי-מטבח/
/product-category/בישול-מטבח-ואפייה/סירים-בישול-ומטבח/
/product-category/בישול-מטבח-ואפייה/סירים-בישול-ומטבח/cucina-mia-איטליה/
```

Deals children:

```text
/product-category/מבצעים/גיפט-קארד/
/product-category/מבצעים/המומלצים-של-אתי/
/product-category/מבצעים/סטוקים/
/product-category/מבצעים/מבצעים-בקנייה-מעל-399/
```

Full list: Yoast `product_cat-sitemap.xml` (167 loc).

---

## 4. Suggested new-app routes (adjust after client review)

Keep old URLs where possible:

| New (if we must shorten) | Preferred keep |
|---|---|
| `/category/:slug` | **Keep** `/product-category/...` nested |
| `/product/:slug` | **Keep** `/product/:slug` |
| `/search` | New is OK (`/search?q=`) — current has no `/search/` page |
| `/sale` | Keep `/sale/` |
| `/hot` | Keep `/hot/` or map to a live category |

Do **not** create `/privacy` as the canonical if `/מדיניות-פרטיות/` already ranks.

---

## 5. Redirect inventory required before cutover

At minimum map 1:1:

- All product permalinks (sitemaps 1–4)
- All 167 category permalinks
- 5 brand permalinks
- Legal/about/contact Hebrew pages
- `/shop/`, `/sale/`, `/hot/`
- Decide `/home-v2/` (index? redirect to `/`? keep as staging?)

`/cart/` and `/checkout/` can stay the same paths on the new origin.

---

## 6. Broken / missing English routes

404: `/contact/`, `/privacy/`, `/terms/`, `/shipping/`, `/returns/`, `/accessibility/`, `/wishlist/`, `/search/`.

Do not add these unless we 301 from them to the Hebrew originals (optional UX).
