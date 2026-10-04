import { describe, expect, it } from "vitest";
import type { IngestBody } from "../schemas/analytics.js";
import { israelOffsetSeconds, toStoredEvents } from "./analyticsService.js";

const body = (events: IngestBody["events"]): IngestBody => ({
  visitorId: "visitor-1234",
  sessionId: "session-1234",
  device: "mobile",
  events,
});

describe("toStoredEvents", () => {
  const now = 1_700_000_000_000;

  it("uses the server clock and keeps the order of events inside a batch", () => {
    const rows = toStoredEvents(
      body([
        { name: "page_view", path: "/shop?x=1", at: 1_000, props: {} },
        { name: "click", path: "/shop", at: 4_000, props: { id: "menu:sale" } },
      ]),
      now,
    );
    expect(rows[1]?.ts).toBe(now);
    expect(rows[0]?.ts).toBe(now - 3_000);
    expect(rows[0]?.path).toBe("/shop");
  });

  it("does not trust a wildly wrong browser clock", () => {
    const rows = toStoredEvents(
      body([
        { name: "page_view", path: "/", at: 1, props: {} },
        { name: "click", path: "/", at: 9_999_999_999_999, props: {} },
      ]),
      now,
    );
    expect(rows[0]?.ts).toBe(now - 3_600_000);
    expect(rows[1]?.ts).toBe(now);
  });

  it("scrubs personal data out of properties", () => {
    const rows = toStoredEvents(body([{ name: "search", path: "/search", props: { query: "me@x.com", results: 3 } }]), now);
    expect(rows[0]?.props).toEqual({ query: "[removed]", results: 3 });
  });
});

describe("israelOffsetSeconds", () => {
  it("is UTC+2 in winter and UTC+3 in summer", () => {
    expect(israelOffsetSeconds(new Date("2026-01-15T12:00:00Z"))).toBe(2 * 3600);
    expect(israelOffsetSeconds(new Date("2026-07-15T12:00:00Z"))).toBe(3 * 3600);
  });
});
