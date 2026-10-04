import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import type { IngestBody } from "../schemas/analytics.js";
import type { AnalyticsSummary } from "../types/analytics.js";
import { logger } from "../utils/logger.js";
import { cleanPath, isBot, scrubProps } from "./analyticsScrub.js";
import { AnalyticsStore, type StoredEvent } from "./analyticsStore.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// server/.data is git-ignored. The file holds anonymous events only: no names, emails or addresses.
const DB_PATH = path.resolve(here, "../../.data/analytics.sqlite");
const DAY_MS = 86_400_000;
const MAX_SKEW_MS = 3_600_000;

let store: AnalyticsStore | null = null;

/** Opens the database on first use (not at import time) and starts the daily cleanup of old events. */
export function getStore(): AnalyticsStore {
  if (store) return store;
  store = new AnalyticsStore(DB_PATH);
  const purge = () => {
    const removed = store?.purgeOlderThan(Date.now() - env.ANALYTICS_RETENTION_DAYS * DAY_MS) ?? 0;
    if (removed > 0) logger.info({ removed }, "analytics.retention_purge");
  };
  purge();
  setInterval(purge, DAY_MS).unref();
  return store;
}

/**
 * Turns a batch from the browser into stored events. Time is the server's: the browser clock only keeps the order of
 * events inside one batch, so a wrong clock cannot put events in the wrong day.
 */
export function toStoredEvents(body: IngestBody, now: number): StoredEvent[] {
  const latest = Math.max(...body.events.map((event) => event.at ?? 0));
  return body.events.map((event) => {
    const ts = event.at === undefined || latest === 0 ? now : Math.min(now, Math.max(now - MAX_SKEW_MS, now - (latest - event.at)));
    return {
      ts,
      visitorId: body.visitorId,
      sessionId: body.sessionId,
      device: body.device,
      name: event.name,
      path: cleanPath(event.path),
      props: scrubProps(event.props),
    };
  });
}

export function ingestEvents(body: IngestBody, userAgent: string | undefined, now = Date.now()): number {
  if (isBot(userAgent)) return 0;
  const rows = toStoredEvents(body, now);
  getStore().insertMany(rows);
  return rows.length;
}

export function forgetVisitor(visitorId: string): number {
  return getStore().forgetVisitor(visitorId);
}

/** Israel is UTC+2 in winter and UTC+3 in summer. Days in the dashboard follow its clock. */
export function israelOffsetSeconds(at: Date): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((entry) => entry.type === "timeZoneName")?.value;
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(part ?? "");
  if (!match) return 3 * 3600;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 3600 + Number(match[3] ?? 0) * 60);
}

export function getSummary(days: number, now = Date.now()): AnalyticsSummary {
  return getStore().summary(days, now, israelOffsetSeconds(new Date(now)));
}
