import type { Request } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const asRequest = (headers: Record<string, string>) => ({ header: (name: string) => headers[name.toLowerCase()] }) as unknown as Request;

async function load(key: string) {
  vi.resetModules();
  vi.stubEnv("EDGE_API_KEY", key);
  return (await import("./edgeKey.js")).hasEdgeKey;
}

afterEach(() => vi.unstubAllEnvs());

describe("hasEdgeKey", () => {
  it("accepts the right key", async () => {
    const hasEdgeKey = await load("secret-value");
    expect(hasEdgeKey(asRequest({ "x-edge-key": "secret-value" }))).toBe(true);
  });

  it("rejects a wrong or missing key", async () => {
    const hasEdgeKey = await load("secret-value");
    expect(hasEdgeKey(asRequest({ "x-edge-key": "other" }))).toBe(false);
    expect(hasEdgeKey(asRequest({}))).toBe(false);
  });

  it("exempts nothing when no key is configured, even with an empty header", async () => {
    const hasEdgeKey = await load("");
    expect(hasEdgeKey(asRequest({ "x-edge-key": "" }))).toBe(false);
    expect(hasEdgeKey(asRequest({}))).toBe(false);
  });
});
