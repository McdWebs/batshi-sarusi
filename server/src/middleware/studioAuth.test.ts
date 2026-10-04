import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/errors.js";

const fakeEnv = vi.hoisted(() => ({ STUDIO_ACCESS_KEY: "", NODE_ENV: "development" as string }));
vi.mock("../config/env.js", () => ({ env: fakeEnv }));

import { requireStudioKey } from "./studioAuth.js";

function run(header?: string) {
  const req = { header: (name: string) => (name.toLowerCase() === "x-studio-key" ? header : undefined) } as unknown as Request;
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  requireStudioKey(req, {} as Response, next);
  return next as unknown as ReturnType<typeof vi.fn>;
}

describe("requireStudioKey", () => {
  beforeEach(() => {
    fakeEnv.STUDIO_ACCESS_KEY = "correct-horse";
    fakeEnv.NODE_ENV = "production";
  });

  it("lets a request with the right code through", () => {
    const next = run("correct-horse");
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a missing or wrong code with 401", () => {
    for (const header of [undefined, "", "wrong", "correct-horse-extra"]) {
      const error = run(header).mock.calls[0]?.[0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("STUDIO_UNAUTHORIZED");
    }
  });

  it("fails closed in production when no code is configured", () => {
    fakeEnv.STUDIO_ACCESS_KEY = "";
    const error = run("anything").mock.calls[0]?.[0] as AppError;
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("STUDIO_LOCKED");
  });

  it("stays open for local development when no code is configured", () => {
    fakeEnv.STUDIO_ACCESS_KEY = "";
    fakeEnv.NODE_ENV = "development";
    expect(run()).toHaveBeenCalledWith();
  });
});
