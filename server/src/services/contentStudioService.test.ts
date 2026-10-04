import { describe, expect, it } from "vitest";
import { AppError } from "../utils/errors.js";
import { buildProductPrompt, buildRevisionPrompt, needsContent, parseGeneratedContent, stripHtml } from "./contentStudioService.js";

const image = { id: 1, src: "https://x/a.jpg", thumbnail: "", srcset: "", sizes: "", name: "", alt: "" };

describe("stripHtml", () => {
  it("removes tags and decodes entities", () => {
    expect(stripHtml("<p>כוס&nbsp;זכוכית &amp; מכסה</p>")).toBe("כוס זכוכית & מכסה");
    expect(stripHtml("  <br> ")).toBe("");
  });
});

describe("needsContent", () => {
  it("selects in-stock products with a photo and no description", () => {
    expect(needsContent({ description: "", shortDescription: "<p> </p>", images: [image], isInStock: true })).toBe(true);
  });

  it("skips products that already have copy, no photo, or no stock", () => {
    expect(needsContent({ description: "<p>יש תיאור</p>", shortDescription: "", images: [image], isInStock: true })).toBe(false);
    expect(needsContent({ description: "", shortDescription: "", images: [], isInStock: true })).toBe(false);
    expect(needsContent({ description: "", shortDescription: "", images: [image], isInStock: false })).toBe(false);
  });
});

describe("parseGeneratedContent", () => {
  const valid = {
    description: "תיאור קצר של המוצר.",
    bullets: ["• ידית נוחה", "- עשוי קרמיקה"],
    seoTitle: "א".repeat(80),
    metaDescription: "ב ".repeat(100),
    imageAlt: "ג".repeat(200),
  };

  it("enforces storefront length limits and strips bullet symbols", () => {
    const parsed = parseGeneratedContent(valid);
    expect(parsed.seoTitle.length).toBeLessThanOrEqual(60);
    expect(parsed.metaDescription.length).toBeLessThanOrEqual(155);
    expect(parsed.imageAlt.length).toBeLessThanOrEqual(125);
    expect(parsed.bullets).toEqual(["ידית נוחה", "עשוי קרמיקה"]);
  });

  it("rejects responses that are missing fields", () => {
    expect(() => parseGeneratedContent({ description: "x" })).toThrow(AppError);
    expect(() => parseGeneratedContent(null)).toThrow(AppError);
  });
});

describe("buildProductPrompt", () => {
  it("lists only real product data and states whether a photo exists", () => {
    const prompt = buildProductPrompt(
      { name: "סט כוסות", categories: ["כוסות"], attributes: [{ name: "צבע", values: ["שקוף", "ירוק"] }] },
      true,
    );
    expect(prompt).toContain("Product name: סט כוסות");
    expect(prompt).toContain("צבע: שקוף / ירוק");
    expect(prompt).toContain("photo is attached");
    expect(buildProductPrompt({ name: "x", categories: [], attributes: [] }, false)).toContain("No usable photo");
  });
});

describe("buildRevisionPrompt", () => {
  it("carries the editor instruction and the current draft, and keeps the no-invention rule", () => {
    const previous = { description: "תיאור", bullets: ["א"], seoTitle: "כותרת", metaDescription: "מטא", imageAlt: "אלט" };
    const prompt = buildRevisionPrompt("Product name: x", { instruction: "קצר יותר, טון יוקרתי", previous });
    expect(prompt).toContain("Product name: x");
    expect(prompt).toContain("Editor instruction: קצר יותר, טון יוקרתי");
    expect(prompt).toContain(JSON.stringify(previous));
    expect(prompt).toContain("do not add anything that is not in the product data");
    expect(prompt).toContain("takes priority over the default lengths");
  });
});
