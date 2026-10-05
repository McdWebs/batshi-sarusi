import type { Category, Product } from "../api/types";
import { categoryPathFromPermalink, productPath } from "../utils/format";
import { categoryPath, priceText, type Crumb } from "./meta";
import { demoteHeadings, escapeHtml, sanitizeHtml, stripHtml } from "./text";

/**
 * Plain-HTML versions of each page, placed inside the empty app shell so a crawler (or a visitor whose
 * script has not loaded yet) sees real headings, text and links. The same facts the React page shows.
 */

const link = (href: string, label: string) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

export const productHref = (product: Pick<Product, "slug">) => encodeURI(productPath(product.slug));

function nav(trail: Crumb[]): string {
  const items = [{ name: "בית", path: "/" }, ...trail].map((crumb) => link(crumb.path, crumb.name));
  return `<nav aria-label="פירורי לחם">${items.join(" › ")}</nav>`;
}

function shell(inner: string): string {
  return `<main id="seo-fallback">${inner}</main>`;
}

export function productBody(product: Product, trail: Crumb[]): string {
  const price = priceText(product.prices);
  const stock = stripHtml(product.stockAvailability.text) || (product.isInStock ? "קיים במלאי" : "אזל מהמלאי");
  const description = demoteHeadings(sanitizeHtml(product.description || product.shortDescription || ""));
  const categories = product.categories.map((category) => link(encodeURI(categoryPathFromPermalink(category.link)), category.name));
  return shell(
    [
      nav(trail),
      `<h1>${escapeHtml(product.name)}</h1>`,
      product.sku ? `<p>מק״ט ${escapeHtml(product.sku)}</p>` : "",
      `<p>${price ? escapeHtml(price) : "המחיר לפי פנייה"}</p>`,
      `<p>${escapeHtml(stock)}</p>`,
      description ? `<div>${description}</div>` : "",
      categories.length ? `<p>קטגוריות: ${categories.join(", ")}</p>` : "",
    ].join(""),
  );
}

export type ListingProduct = Pick<Product, "slug" | "name" | "prices">;

function productList(products: ListingProduct[]): string {
  if (!products.length) return "";
  const items = products.map((product) => {
    const price = priceText(product.prices);
    return `<li>${link(productHref(product), product.name)}${price ? ` - ${escapeHtml(price)}` : ""}</li>`;
  });
  return `<ul>${items.join("")}</ul>`;
}

function pagination(basePath: string, page: number, totalPages: number): string {
  if (totalPages <= 1) return "";
  const links: string[] = [];
  if (page > 1) links.push(link(page === 2 ? basePath : `${basePath}?page=${page - 1}`, "העמוד הקודם"));
  if (page < totalPages) links.push(link(`${basePath}?page=${page + 1}`, "העמוד הבא"));
  return `<p>עמוד ${page} מתוך ${totalPages}</p><p>${links.join(" | ")}</p>`;
}

export function listingBody(args: {
  title: string;
  trail: Crumb[];
  descriptionHtml?: string;
  children?: Category[];
  products: ListingProduct[];
  basePath: string;
  page: number;
  totalPages: number;
}): string {
  const children = (args.children ?? []).map((child) => `<li>${link(categoryPath(child), child.name)}</li>`);
  return shell(
    [
      nav(args.trail),
      `<h1>${escapeHtml(args.title)}</h1>`,
      args.descriptionHtml ? `<div>${demoteHeadings(sanitizeHtml(args.descriptionHtml))}</div>` : "",
      children.length ? `<ul>${children.join("")}</ul>` : "",
      productList(args.products),
      pagination(args.basePath, args.page, args.totalPages),
    ].join(""),
  );
}

export function directoryBody(title: string, categories: Category[]): string {
  const items = categories.map((category) => `<li>${link(categoryPath(category), category.name)}</li>`);
  return shell([nav([]), `<h1>${escapeHtml(title)}</h1>`, items.length ? `<ul>${items.join("")}</ul>` : ""].join(""));
}

export function homeBody(departments: Category[], collections: Category[], deals: ListingProduct[]): string {
  const list = (items: Category[]) => `<ul>${items.map((category) => `<li>${link(categoryPath(category), category.name)}</li>`).join("")}</ul>`;
  return shell(
    [
      "<h1>בתשי הום - הכול לבית</h1>",
      "<p>כלי מטבח, הגשה, טקסטיל ועיצוב הבית במבחר רחב ובמחירים משתלמים.</p>",
      departments.length ? `<h2>מחלקות</h2>${list(departments)}` : "",
      collections.length ? `<h2>קולקציות</h2>${list(collections)}` : "",
      deals.length ? `<h2>מבצעים עכשיו</h2>${productList(deals)}<p>${link("/sale", "לכל המבצעים")}</p>` : "",
    ].join(""),
  );
}

export function cmsBody(title: string, html: string): string {
  return shell([nav([]), `<h1>${escapeHtml(stripHtml(title))}</h1>`, `<div>${demoteHeadings(sanitizeHtml(html))}</div>`].join(""));
}

export function headingBody(title: string): string {
  return shell([nav([]), `<h1>${escapeHtml(title)}</h1>`].join(""));
}

export function notFoundBody(): string {
  return shell(`<h1>העמוד לא נמצא.</h1><p>${link("/", "חזרה לדף הבית")}</p>`);
}

