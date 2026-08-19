import { afterEach, describe, expect, it, vi } from "vitest";
import { cached, clearCache } from "./cache.js";

describe("catalog cache", () => {
  afterEach(() => {
    clearCache();
    vi.useRealTimers();
  });

  it("returns cached value until ttl expires", async () => {
    vi.useFakeTimers();
    let loads = 0;
    const load = async () => {
      loads += 1;
      return loads;
    };

    await expect(cached("n", 1_000, load)).resolves.toBe(1);
    await expect(cached("n", 1_000, load)).resolves.toBe(1);
    vi.advanceTimersByTime(1_001);
    await expect(cached("n", 1_000, load)).resolves.toBe(2);
  });

  it("coalesces concurrent misses", async () => {
    let loads = 0;
    const load = async () => {
      loads += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "ok";
    };

    const [a, b] = await Promise.all([cached("same", 1_000, load), cached("same", 1_000, load)]);
    expect(a).toBe("ok");
    expect(b).toBe("ok");
    expect(loads).toBe(1);
  });

  it("does not cache rejected loads", async () => {
    let loads = 0;
    await expect(
      cached("fail", 1_000, async () => {
        loads += 1;
        throw new Error("nope");
      }),
    ).rejects.toThrow("nope");
    await expect(
      cached("fail", 1_000, async () => {
        loads += 1;
        return "recovered";
      }),
    ).resolves.toBe("recovered");
    expect(loads).toBe(2);
  });
});
