import { describe, expect, it } from "vitest";
import { cleanPath, isBot, scrubProps, scrubText } from "./analyticsScrub.js";

describe("scrubText", () => {
  it("removes emails and phone numbers but keeps normal words", () => {
    expect(scrubText("כוס זכוכית")).toBe("כוס זכוכית");
    expect(scrubText("write to dana@example.com please")).toBe("write to [removed] please");
    expect(scrubText("call 054-123-4567 now")).toBe("call [removed] now");
    expect(scrubText("+972 54 123 4567")).toBe("[removed]");
    expect(scrubText("סט 6 כוסות 330")).toBe("סט 6 כוסות 330");
    expect(scrubText("ארגונית CK35663-1/33.5/16.5")).toBe("ארגונית CK35663-1/33.5/16.5");
    expect(scrubText("tel 0541234567")).toBe("tel [removed]");
  });
});

describe("scrubProps", () => {
  it("scrubs strings and leaves numbers, booleans and null alone", () => {
    expect(scrubProps({ query: "a@b.co", results: 0, inStock: false, note: null })).toEqual({
      query: "[removed]",
      results: 0,
      inStock: false,
      note: null,
    });
  });
});

describe("cleanPath", () => {
  it("drops the query string and the hash", () => {
    expect(cleanPath("/search?q=dana@example.com#x")).toBe("/search");
    expect(cleanPath("/product/abc")).toBe("/product/abc");
    expect(cleanPath("shop")).toBe("/shop");
  });
});

describe("isBot", () => {
  it("flags crawlers and missing user agents", () => {
    expect(isBot(undefined)).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1")).toBe(false);
  });
});
