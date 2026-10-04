import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/errors.js";
import { IMAGE_WIDTHS, ImageCache, getOptimizedImage, pickFormat, snapWidth, validateSourceUrl } from "./imageProxy.js";

const HOST = "batshi-home.co.il";
const GOOD = "https://batshi-home.co.il/wp-content/uploads/2026/09/photo.jpg";

describe("snapWidth", () => {
  it("rounds up to the next allowed width and caps at the largest", () => {
    expect(snapWidth(1)).toBe(240);
    expect(snapWidth(240)).toBe(240);
    expect(snapWidth(241)).toBe(360);
    expect(snapWidth(700)).toBe(720);
    expect(snapWidth(4000)).toBe(IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]);
  });
});

describe("validateSourceUrl", () => {
  it("accepts a photo in the shop's uploads folder, including Hebrew file names", () => {
    expect(validateSourceUrl(GOOD, HOST).pathname).toBe("/wp-content/uploads/2026/09/photo.jpg");
    expect(() => validateSourceUrl("https://batshi-home.co.il/wp-content/uploads/2026/09/%D7%98%D7%95%D7%A4%D7%A8.jpeg", HOST)).not.toThrow();
  });

  it.each([
    ["another host", "https://evil.example.com/wp-content/uploads/a.jpg"],
    ["a look-alike host", "https://batshi-home.co.il.evil.com/wp-content/uploads/a.jpg"],
    ["plain http", "http://batshi-home.co.il/wp-content/uploads/a.jpg"],
    ["credentials in the url", "https://user:pw@batshi-home.co.il/wp-content/uploads/a.jpg"],
    ["a custom port", "https://batshi-home.co.il:8443/wp-content/uploads/a.jpg"],
    ["outside the uploads folder", "https://batshi-home.co.il/wp-admin/export.php"],
    ["a path trick", "https://batshi-home.co.il/wp-content/uploads/../../wp-config.php"],
    ["a local address", "http://127.0.0.1:3010/health"],
    ["not a url", "not a url"],
  ])("rejects %s", (_label, value) => {
    expect(() => validateSourceUrl(value, HOST)).toThrow(AppError);
  });
});

describe("pickFormat", () => {
  it("uses WebP when the browser accepts it and JPEG otherwise", () => {
    expect(pickFormat("image/avif,image/webp,image/apng,*/*;q=0.8")).toBe("webp");
    expect(pickFormat("image/png,*/*")).toBe("jpeg");
    expect(pickFormat(undefined)).toBe("jpeg");
  });
});

describe("ImageCache", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "batshi-img-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("stores and returns a variant, and returns null for a miss", async () => {
    const cache = new ImageCache(path.join(dir, "c"), 1_000_000);
    expect(await cache.get("nope")).toBeNull();
    await cache.set("abc", Buffer.from("hello"));
    expect((await cache.get("abc"))?.toString()).toBe("hello");
  });

  it("removes the oldest files once the folder is over its limit", async () => {
    const cache = new ImageCache(dir, 1_000);
    for (let index = 0; index < 5; index += 1) {
      await fs.writeFile(path.join(dir, `f${index}`), Buffer.alloc(400));
      await fs.utimes(path.join(dir, `f${index}`), new Date(1_000 * (index + 1)), new Date(1_000 * (index + 1)));
    }
    expect(await cache.evict()).toBeGreaterThan(0);
    const left = await fs.readdir(dir);
    expect(left).toContain("f4");
    expect(left).not.toContain("f0");
  });
});

describe("getOptimizedImage", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "batshi-img-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function bigPhoto() {
    // Noisy pixels compress badly, like a heavy phone photo.
    const raw = Buffer.alloc(2000 * 1500 * 3);
    for (let index = 0; index < raw.length; index += 1) raw[index] = (index * 7919 + (index >> 3) * 31) & 255;
    return sharp(raw, { raw: { width: 2000, height: 1500, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
  }

  it("returns a much smaller WebP at the requested width, then serves the cached copy", async () => {
    const original = await bigPhoto();
    const fetcher = vi.fn(async () => original);
    const cache = new ImageCache(dir, 50_000_000);
    const url = new URL(GOOD);

    const first = await getOptimizedImage({ url, width: 480, format: "webp", cache, fetcher });
    const meta = await sharp(first.body).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(480);
    expect(first.body.length).toBeLessThan(original.length / 5);
    expect(first.contentType).toBe("image/webp");
    expect(first.cacheHit).toBe(false);

    const second = await getOptimizedImage({ url, width: 480, format: "webp", cache, fetcher });
    expect(second.cacheHit).toBe(true);
    expect(second.etag).toBe(first.etag);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("never enlarges a small original", async () => {
    const small = await sharp({ create: { width: 200, height: 200, channels: 3, background: "#aa8844" } }).jpeg().toBuffer();
    const result = await getOptimizedImage({ url: new URL(GOOD), width: 720, format: "jpeg", cache: new ImageCache(dir, 1e7), fetcher: async () => small });
    expect((await sharp(result.body).metadata()).width).toBe(200);
  });

  it("downloads the original once when many shoppers ask for the same photo at the same moment", async () => {
    const original = await sharp({ create: { width: 900, height: 900, channels: 3, background: "#336699" } }).jpeg().toBuffer();
    const fetcher = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return original;
    });
    const args = { url: new URL(GOOD), width: 360, format: "webp" as const, cache: new ImageCache(dir, 1e7), fetcher };
    await Promise.all(Array.from({ length: 6 }, () => getOptimizedImage(args)));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("reports an unreadable file as an error instead of crashing", async () => {
    await expect(
      getOptimizedImage({ url: new URL(GOOD), width: 240, format: "webp", cache: new ImageCache(dir, 1e7), fetcher: async () => Buffer.from("not an image") }),
    ).rejects.toMatchObject({ code: "IMAGE_UNREADABLE" });
  });
});
