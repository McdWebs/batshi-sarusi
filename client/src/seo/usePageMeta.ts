import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_SITE_URL, SITE_NAME } from "./config";
import { genericMeta, contactMeta, directoryMeta, homeMeta, notFoundMeta, saleMeta, searchMeta, shopMeta, utilityMeta, type PageMeta } from "./meta";
import { classifyPath } from "./route";
import { safeJson } from "./html";

/** The public address of the storefront, used for canonical links and structured data. */
export function siteOrigin(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/$/, "");
}

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) return existing;
  const element = create();
  document.head.appendChild(element);
  return element;
}

function setMeta(attribute: "name" | "property", key: string, content: string | null) {
  const selector = `meta[${attribute}="${key}"]`;
  if (content === null) {
    document.head.querySelector(selector)?.remove();
    return;
  }
  const element = upsert(selector, () => {
    const created = document.createElement("meta");
    created.setAttribute(attribute, key);
    return created;
  });
  element.setAttribute("content", content);
}

/** Writes one page's tags into <head>, replacing the ones from the previous page (or from the edge function). */
export function applyMeta(meta: PageMeta) {
  const origin = siteOrigin();
  const url = meta.path ? `${origin}${meta.path}` : null;
  // A copy of the site on any other address (a preview, a test) must never compete with the real one.
  const noindex = Boolean(meta.noindex) || window.location.origin !== origin;

  document.title = meta.title;
  setMeta("name", "description", meta.description);
  setMeta("name", "robots", noindex ? "noindex,follow" : null);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:locale", "he_IL");
  setMeta("property", "og:type", meta.ogType ?? "website");
  setMeta("property", "og:title", meta.title);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:image", meta.image ?? null);
  setMeta("name", "twitter:card", meta.image ? "summary_large_image" : "summary");

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (url) {
    const link = canonical ?? (upsert('link[rel="canonical"]', () => {
      const created = document.createElement("link");
      created.rel = "canonical";
      return created;
    }) as HTMLLinkElement);
    link.href = url;
  } else {
    canonical?.remove();
  }

  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((node) => node.remove());
  for (const item of meta.jsonLd ?? []) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = safeJson(item);
    document.head.appendChild(script);
  }
}

/** A page that knows its own data calls this once the data is in. Passing null keeps whatever is there. */
export function usePageMeta(meta: PageMeta | null) {
  const key = meta ? JSON.stringify(meta) : "";
  useEffect(() => {
    if (meta) applyMeta(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Page number from "?page=N", as in the catalog. */
function pageFromSearch(search: string): number {
  const page = Math.floor(Number(new URLSearchParams(search).get("page") || "1"));
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

/**
 * Sets the tags for pages that need no data (home, shop, cart, ...) as soon as the address changes, and a neutral
 * title for pages that will set their own once loaded, so the previous page's title never lingers.
 */
export function RouteMeta() {
  const { pathname, search } = useLocation();
  const first = useRef(true);
  const lastPath = useRef(pathname);

  useLayoutEffect(() => {
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const route = classifyPath(pathname);
    const page = pageFromSearch(search);
    const origin = siteOrigin();
    switch (route.kind) {
      case "home":
        applyMeta(homeMeta(origin));
        break;
      case "shop":
        applyMeta(shopMeta(page));
        break;
      case "sale":
        applyMeta(saleMeta(page));
        break;
      case "directory":
        applyMeta(directoryMeta(route.which));
        break;
      case "contact":
        applyMeta(contactMeta());
        break;
      case "search":
        applyMeta(searchMeta());
        break;
      case "utility":
        applyMeta(utilityMeta(route.name));
        break;
      case "unknown":
        applyMeta(notFoundMeta());
        break;
      default:
        // product, category, brand, cms: the page sets its own once its data arrives. On the first load the
        // edge function's tags are already in place, so they are left alone, and so are the page's own tags when
        // only the sort, filter or page number in the address changed.
        if (!first.current && pathChanged) applyMeta(genericMeta());
    }
    first.current = false;
  }, [pathname, search]);

  return null;
}
