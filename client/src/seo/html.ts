import type { PageMeta } from "./meta";
import { SITE_NAME } from "./config";
import { escapeHtml } from "./text";

const FALLBACK_CSS =
  "#seo-fallback{max-width:1000px;margin:0 auto;padding:24px 16px 48px;font-family:Heebo,Arial,sans-serif;color:#2c241e;line-height:1.7}" +
  "#seo-fallback a{color:#8f3d2a}#seo-fallback h1{font-size:28px;line-height:1.3;margin:12px 0}" +
  "#seo-fallback img{max-width:100%;height:auto}#seo-fallback ul{padding-inline-start:18px}";

/** JSON placed in a script tag must not be able to close the tag or start an HTML comment. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function metaTag(attribute: "name" | "property", key: string, content: string): string {
  return `<meta ${attribute}="${key}" content="${escapeHtml(content)}" data-seo>`;
}

/** The tags that go in <head> for one page: title, description, canonical, robots, link previews and structured data. */
export function renderHeadTags(meta: PageMeta, origin: string, forceNoindex = false): string {
  const base = origin.replace(/\/$/, "");
  const url = meta.path ? `${base}${meta.path}` : null;
  const noindex = Boolean(meta.noindex || forceNoindex);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    metaTag("name", "description", meta.description),
    url ? `<link rel="canonical" href="${escapeHtml(url)}" data-seo>` : "",
    noindex ? metaTag("name", "robots", "noindex,follow") : "",
    metaTag("property", "og:site_name", SITE_NAME),
    metaTag("property", "og:locale", "he_IL"),
    metaTag("property", "og:type", meta.ogType ?? "website"),
    metaTag("property", "og:title", meta.title),
    metaTag("property", "og:description", meta.description),
    url ? metaTag("property", "og:url", url) : "",
    meta.image ? metaTag("property", "og:image", meta.image) : "",
    metaTag("name", "twitter:card", meta.image ? "summary_large_image" : "summary"),
    ...(meta.jsonLd ?? []).map((item) => `<script type="application/ld+json" data-seo>${safeJson(item)}</script>`),
    `<style data-seo>${FALLBACK_CSS}</style>`,
  ];
  return tags.filter(Boolean).join("\n    ");
}

/**
 * Puts one page's tags and plain-HTML content into the built `index.html`. The empty shell's own title and
 * description are removed so the page has exactly one of each. React replaces the content once it loads.
 */
export function applyToIndex(indexHtml: string, headTags: string, bodyHtml: string): string {
  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/i, "");
  html = html.includes("</head>") ? html.replace("</head>", `    ${headTags}\n  </head>`) : `${headTags}${html}`;
  html = html.replace(/<div id="root"><\/div>/, () => `<div id="root">${bodyHtml}</div>`);
  return html;
}
