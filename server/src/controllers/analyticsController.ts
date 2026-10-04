import type { Request, Response } from "express";
import { forgetBodySchema, ingestBodySchema, summaryQuerySchema } from "../schemas/analytics.js";
import { forgetVisitor, getSummary, ingestEvents } from "../services/analyticsService.js";
import { parseWith } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { sendSuccess } from "../utils/http.js";

/** The browser sends batches as text/plain so that navigator.sendBeacon works across origins without a preflight. */
function readBody(req: Request): unknown {
  if (typeof req.body !== "string") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    throw new AppError("VALIDATION_ERROR", "Body must be JSON", 400);
  }
}

export async function ingestEventsHandler(req: Request, res: Response) {
  const body = parseWith(ingestBodySchema, readBody(req));
  ingestEvents(body, req.get("user-agent"));
  res.setHeader("Cache-Control", "no-store");
  res.status(204).end();
}

export async function forgetVisitorHandler(req: Request, res: Response) {
  const { visitorId } = parseWith(forgetBodySchema, readBody(req));
  forgetVisitor(visitorId);
  res.setHeader("Cache-Control", "no-store");
  res.status(204).end();
}

export async function analyticsSummaryHandler(req: Request, res: Response) {
  const { days } = parseWith(summaryQuerySchema, req.query);
  sendSuccess(res, getSummary(days), 200, 0);
}
