/**
 * Checks that the new storefront answers every address the old site had in its sitemaps, with a page search engines
 * can read: status 200, its own title, a canonical link back to the same address, one headline, and for products
 * Product structured data.
 *
 *   npx tsx scripts/seo-parity.ts [--target=http://localhost:5173] [--products=150] [--all] [--concurrency=6]
 *
 * --products=N checks a random sample of N products (default 150); --all checks every product (slow: one shop
 * request per product). Everything else (pages, categories, brands) is always checked in full.
 */
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? "true"] as const;
  }),
);

const SHOP = (process.env.SHOP_ORIGIN ?? "https://batshi-home.co.il").replace(/\/$/, "");
const TARGET = (args.get("target") ?? "http://localhost:5173").replace(/\/$/, "");
const SAMPLE = Number(args.get("products") ?? 150);
const ALL = args.has("all");
const CONCURRENCY = Number(args.get("concurrency") ?? 6);
const GENERIC_TITLES = new Set(["Batshi Sarusi", ""]);
/** Pages the old sitemap lists but search engines have no use for. The new site keeps them out of results on purpose. */
const NOT_FOR_SEARCH = /^\/(cart|checkout|my-account|affiliate-dashboard)\/$/;

const UA = { "user-agent": "Mozilla/5.0 (compatible; seo-parity-check)" };

async function sitemapUrls(file: string): Promise<string[]> {
  const response = await fetch(`${SHOP}${file}`, { headers: UA });
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] as string);
}

async function allSitemapFiles(): Promise<string[]> {
  const index = await sitemapUrls("/sitemap_index.xml");
  return index.map((url) => new URL(url).pathname);
}

type Kind = "page" | "product" | "category" | "brand" | "other";
const kindOf = (file: string): Kind =>
  file.startsWith("/product-sitemap") ? "product" : file.startsWith("/product_cat") ? "category" : file.startsWith("/product_brand") ? "brand" : file.startsWith("/page-sitemap") ? "page" : "other";

type Result = { url: string; kind: Kind; problems: string[]; status: number };

function pick<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy.slice(0, count);
}

async function check(oldUrl: string, kind: Kind): Promise<Result> {
  const path = new URL(oldUrl).pathname;
  const problems: string[] = [];
  let status = 0;
  try {
    const response = await fetch(`${TARGET}${path}`, { headers: UA, redirect: "manual" });
    status = response.status;
    if (status >= 300 && status < 400) {
      problems.push(`redirects (${status}) to ${response.headers.get("location")}`);
    } else if (status !== 200) {
      problems.push(`status ${status}`);
    } else {
      const html = await response.text();
      const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1]?.trim() ?? "";
      if (GENERIC_TITLES.has(title)) problems.push("generic or missing title");
      const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
      if (NOT_FOR_SEARCH.test(decodeURIComponent(path))) return { url: decodeURIComponent(path), kind, problems, status };
      if (!canonical) problems.push("no canonical link");
      else if (decodeURIComponent(new URL(canonical).pathname) !== decodeURIComponent(path)) {
        problems.push(`canonical differs: ${decodeURIComponent(new URL(canonical).pathname)}`);
      }
      const h1 = html.match(/<h1[\s>]/g)?.length ?? 0;
      if (h1 !== 1 && kind !== "other") problems.push(`${h1} headlines in the first response`);
      if (kind === "product" && decodeURIComponent(path).startsWith("/product/") && !html.includes('"@type":"Product"')) problems.push("no Product structured data");
      if (!/name="description"/.test(html)) problems.push("no meta description");
    }
  } catch (error) {
    problems.push(`request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return { url: decodeURIComponent(path), kind, problems, status };
}

async function main() {
  const files = (await allSitemapFiles()).filter((file) => kindOf(file) !== "other");
  const byKind = new Map<Kind, string[]>();
  for (const file of files) {
    const urls = await sitemapUrls(file);
    byKind.set(kindOf(file), [...(byKind.get(kindOf(file)) ?? []), ...urls]);
  }

  const queue: Array<{ url: string; kind: Kind }> = [];
  for (const [kind, urls] of byKind) {
    const chosen = kind === "product" && !ALL ? pick(urls, SAMPLE) : urls;
    for (const url of chosen) queue.push({ url, kind });
  }
  console.log(`Old sitemaps: ${[...byKind].map(([kind, urls]) => `${kind} ${urls.length}`).join(", ")}`);
  console.log(`Checking ${queue.length} addresses on ${TARGET} (${CONCURRENCY} at a time)...`);

  const results: Result[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < queue.length) {
        const item = queue[cursor++] as { url: string; kind: Kind };
        results.push(await check(item.url, item.kind));
        if (results.length % 50 === 0) console.log(`  ${results.length}/${queue.length}`);
      }
    }),
  );

  const failed = results.filter((result) => result.problems.length);
  const summary = new Map<string, { checked: number; failed: number }>();
  for (const result of results) {
    const row = summary.get(result.kind) ?? { checked: 0, failed: 0 };
    row.checked += 1;
    if (result.problems.length) row.failed += 1;
    summary.set(result.kind, row);
  }
  console.log("\nResult by kind:");
  for (const [kind, row] of summary) console.log(`  ${kind.padEnd(9)} checked ${String(row.checked).padStart(5)}  failed ${row.failed}`);

  const reasons = new Map<string, number>();
  for (const result of failed) for (const problem of result.problems) reasons.set(problem.replace(/:.*$/, "").replace(/\d+/g, "N"), (reasons.get(problem.replace(/:.*$/, "").replace(/\d+/g, "N")) ?? 0) + 1);
  if (reasons.size) {
    console.log("\nProblems:");
    for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(5)}  ${reason}`);
    console.log("\nFirst failures:");
    for (const result of failed.slice(0, 25)) console.log(`  [${result.kind}] ${result.url}\n      ${result.problems.join("; ")}`);
  }
  process.exitCode = failed.length ? 1 : 0;
}

void main();
