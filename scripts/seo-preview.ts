/**
 * Serves client/dist the way Vercel will: files as they are, and every other address through middleware.ts, falling
 * back to the single-page app when the middleware lets the request pass. For checking SEO output locally.
 *
 *   npm run build -w client && API_BASE_URL=http://localhost:3010 npx tsx scripts/seo-preview.ts [port]
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import middleware, { config } from "../middleware";

const dist = join(import.meta.dirname, "..", "client", "dist");
const port = Number(process.argv[2] ?? process.env.PORT ?? 5173);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};

/** The same test the `matcher` in middleware.ts applies, so this mirrors which requests reach it. */
const matchers = config.matcher.map((pattern) => {
  if (pattern.startsWith("/((?!")) return (path: string) => !/^\/(assets|vendor|api)\//.test(path) && !/\./.test(path);
  const source = pattern.replace(/:kind/g, "[a-z_]+").replace(/:n\(\\\\d\+\)/g, "\\d+").replace(/\./g, "\\.");
  return (path: string) => new RegExp(`^${source}$`).test(path);
});

const COMPRESSIBLE = new Set([".html", ".js", ".css", ".svg", ".json", ".txt"]);

/** Vercel compresses text files; so does this, or load times here would not mean anything. */
function send(req: { headers: Record<string, string | string[] | undefined> }, res: import("node:http").ServerResponse, status: number, headers: Record<string, string>, body: Buffer, compress: boolean) {
  const acceptsGzip = String(req.headers["accept-encoding"] ?? "").includes("gzip");
  if (compress && acceptsGzip && body.length > 1024) {
    res.writeHead(status, { ...headers, "content-encoding": "gzip", vary: "accept-encoding" });
    res.end(gzipSync(body));
    return;
  }
  res.writeHead(status, headers);
  res.end(body);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const path = decodeURIComponent(url.pathname);
  const file = normalize(join(dist, path));

  if (file.startsWith(dist) && existsSync(file) && statSync(file).isFile()) {
    send(req, res, 200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }, readFileSync(file), COMPRESSIBLE.has(extname(file)));
    return;
  }

  const spa = () => {
    send(req, res, 200, { "content-type": TYPES[".html"] }, readFileSync(join(dist, "index.html")), true);
  };

  if (!matchers.some((matches) => matches(url.pathname))) return spa();

  const response = await middleware(new Request(url, { method: req.method ?? "GET" }));
  if (response.headers.get("x-middleware-next")) return spa();
  send(req, res, response.status, Object.fromEntries(response.headers), Buffer.from(await response.arrayBuffer()), true);
}).listen(port, () => console.log(`SEO preview on http://localhost:${port} (API ${process.env.API_BASE_URL ?? "unset"})`));
