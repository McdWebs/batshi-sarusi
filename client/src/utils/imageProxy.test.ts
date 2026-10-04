import { describe, expect, it } from "vitest";
import { isProxiable, optimizeImage, parseSrcset } from "./imageProxy";

const base = "https://batshi-home.co.il/wp-content/uploads/2026/09/";
const srcset = `${base}p-300x300.jpg 300w, ${base}p-150x150.jpg 150w, ${base}p-768x768.jpg 768w, ${base}p.jpg 1200w`;

describe("isProxiable", () => {
  it("accepts photos in the shop's uploads folder only", () => {
    expect(isProxiable(`${base}p.jpg`)).toBe(true);
    expect(isProxiable("/assets/batshi-logo.png")).toBe(false);
    expect(isProxiable("http://batshi-home.co.il/wp-content/uploads/p.jpg")).toBe(false);
    expect(isProxiable("https://example.com/logo.png")).toBe(false);
    expect(isProxiable("not a url")).toBe(false);
  });
});

describe("parseSrcset", () => {
  it("reads WordPress's list and sorts it by width", () => {
    expect(parseSrcset(srcset).map((candidate) => candidate.width)).toEqual([150, 300, 768, 1200]);
    expect(parseSrcset(undefined)).toEqual([]);
  });
});

describe("optimizeImage", () => {
  it("builds one entry per width the original can fill, each cut from the smallest big-enough copy", () => {
    const result = optimizeImage(`${base}p-300x300.jpg`, srcset)!;
    const entries = result.srcSet.split(", ");
    expect(entries.map((entry) => entry.split(" ")[1])).toEqual(["240w", "360w", "480w", "720w", "1080w"]);
    const fromFor = (width: string) => decodeURIComponent(entries.find((entry) => entry.endsWith(` ${width}`))!.split("?url=")[1]!.split("&")[0]!);
    expect(fromFor("240w")).toBe(`${base}p-300x300.jpg`);
    expect(fromFor("480w")).toBe(`${base}p-768x768.jpg`);
    expect(fromFor("1080w")).toBe(`${base}p.jpg`);
    expect(result.src).toContain("w=720");
  });

  it("does not ask for widths the original is too small for", () => {
    const small = optimizeImage(`${base}p-300x300.jpg`, `${base}p-150x150.jpg 150w, ${base}p-300x300.jpg 300w`)!;
    expect(small.srcSet.split(", ").map((entry) => entry.split(" ")[1])).toEqual(["240w"]);
  });

  it("works with no srcset at all, and leaves other images alone", () => {
    expect(optimizeImage(`${base}p.jpg`)!.srcSet).toContain("1080w");
    expect(optimizeImage("/assets/hero.png")).toBeNull();
  });
});
