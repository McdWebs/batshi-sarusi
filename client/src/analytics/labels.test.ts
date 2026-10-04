import { describe, expect, it } from "vitest";
import { durationWords, parseDays, parseTab, secondsText } from "./labels";

describe("parseTab", () => {
  it("accepts the five tabs and falls back to visitors", () => {
    expect(parseTab("buying")).toBe("buying");
    expect(parseTab("health")).toBe("health");
    expect(parseTab("nope")).toBe("visitors");
    expect(parseTab(null)).toBe("visitors");
  });
});

describe("parseDays", () => {
  it("falls back to 7 days", () => {
    expect(parseDays("30")).toBe(30);
    expect(parseDays("5")).toBe(7);
    expect(parseDays(null)).toBe(7);
  });
});

describe("spoken durations", () => {
  it("writes seconds and minutes in words", () => {
    expect(secondsText(2100)).toBe("2.1 שניות");
    expect(secondsText(1000)).toBe("שנייה אחת");
    expect(durationWords(12)).toBe("12 שניות");
    expect(durationWords(80)).toBe("1:20 דקות");
  });
});
