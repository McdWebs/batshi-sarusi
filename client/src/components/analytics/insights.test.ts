import { describe, expect, it } from "vitest";
import { isLatinText, lcpRating, orderCheckoutFields, safeDecode, shortImagePath } from "./insights";

describe("orderCheckoutFields", () => {
  it("follows the real form order and puts unknown fields last", () => {
    const rows = [
      { field: "weird", sessions: 90 },
      { field: "phone", sessions: 40 },
      { field: "first_name", sessions: 50 },
      { field: "notes", sessions: 5 },
      { field: "email", sessions: 45 },
    ];
    expect(orderCheckoutFields(rows).map((row) => row.field)).toEqual(["first_name", "phone", "email", "notes", "weird"]);
  });
});

describe("shortImagePath", () => {
  it("keeps the last two path segments", () => {
    expect(shortImagePath("https://x.test/wp-content/uploads/2026/10/a.jpg?w=300")).toBe("10/a.jpg");
    expect(shortImagePath("/uploads/a.jpg")).toBe("uploads/a.jpg");
    expect(shortImagePath("a.jpg")).toBe("a.jpg");
  });
});

describe("safeDecode", () => {
  it("decodes and survives malformed input", () => {
    expect(safeDecode("/%D7%A9%D7%9C%D7%95%D7%9D")).toBe("/שלום");
    expect(safeDecode("/100%")).toBe("/100%");
  });
});

describe("isLatinText", () => {
  it("is false when Hebrew is present", () => {
    expect(isLatinText("/old-page")).toBe(true);
    expect(isLatinText("/שלום")).toBe(false);
  });
});

describe("lcpRating", () => {
  it("uses the Web Vitals lines", () => {
    expect(lcpRating(2500)).toBe("good");
    expect(lcpRating(2501)).toBe("needs");
    expect(lcpRating(4000)).toBe("needs");
    expect(lcpRating(4001)).toBe("poor");
  });
});
