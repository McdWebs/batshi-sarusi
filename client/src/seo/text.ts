const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const point = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point < 0x110000 ? String.fromCodePoint(point) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Plain text from shop HTML: tags removed, entities decoded, spaces collapsed. */
export function stripHtml(html: string): string {
  const withoutBlocks = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  const spaced = withoutBlocks.replace(/<\/(p|div|li|h[1-6]|br|tr)>|<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " ");
  return decodeEntities(spaced).replace(/\s+/g, " ").trim();
}

/** Cuts at a word boundary and adds an ellipsis when the text is longer than `max`. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Shop-written text sometimes has its own <h1>; the page already has one, so those become <h2>. */
export function demoteHeadings(html: string): string {
  return html.replace(/<(\/?)h1\b/gi, "<$1h2");
}

/**
 * Removes anything executable from shop-written HTML before it is placed in a page: script, style, frames,
 * inline event handlers and javascript: links. The text comes from the shop owner, not from visitors.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta|form)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"');
}
