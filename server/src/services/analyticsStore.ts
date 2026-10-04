import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { AnalyticsSummary, CartInsights, Engagement, FunnelStep, Kpis, Problems, Speed } from "../types/analytics.js";

export type StoredEvent = {
  ts: number;
  visitorId: string;
  sessionId: string;
  device: "mobile" | "tablet" | "desktop";
  name: string;
  path: string;
  props: Record<string, string | number | boolean | null>;
  demo?: boolean;
};

const DAY_MS = 86_400_000;
const TOP = 10;

type KpiRow = { visitors: number; sessions: number; pageViews: number | null };
type SessionRow = { bounce: number | null; avgSec: number | null };

/**
 * First-party analytics storage: one SQLite file, one table of events, no personal data.
 * The dashboard numbers are plain SQL over that table.
 */
export class AnalyticsStore {
  private readonly db: Database.Database;

  constructor(filePath: string) {
    if (filePath !== ":memory:") fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    if (filePath !== ":memory:") this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY,
        ts INTEGER NOT NULL,
        visitor_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        device TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        props TEXT NOT NULL,
        demo INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
      CREATE INDEX IF NOT EXISTS idx_events_name_ts ON events(name, ts);
      CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
      CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id);
    `);
  }

  close() {
    this.db.close();
  }

  insertMany(events: StoredEvent[]) {
    const insert = this.db.prepare(
      "INSERT INTO events (ts, visitor_id, session_id, device, name, path, props, demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const run = this.db.transaction((rows: StoredEvent[]) => {
      for (const row of rows) {
        insert.run(row.ts, row.visitorId, row.sessionId, row.device, row.name, row.path, JSON.stringify(row.props), row.demo ? 1 : 0);
      }
    });
    run(events);
  }

  count(): number {
    return (this.db.prepare("SELECT COUNT(*) AS c FROM events").get() as { c: number }).c;
  }

  /** Deletes everything older than the cutoff. Returns how many rows went. */
  purgeOlderThan(cutoffMs: number): number {
    return this.db.prepare("DELETE FROM events WHERE ts < ?").run(cutoffMs).changes;
  }

  /** Deletes every event of one visitor (their right to be forgotten). */
  forgetVisitor(visitorId: string): number {
    return this.db.prepare("DELETE FROM events WHERE visitor_id = ?").run(visitorId).changes;
  }

  deleteDemoData(): number {
    return this.db.prepare("DELETE FROM events WHERE demo = 1").run().changes;
  }

  private kpis(from: number, to: number): Kpis {
    const totals = this.db
      .prepare(
        `SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions,
                SUM(name = 'page_view') AS pageViews
         FROM events WHERE ts >= ? AND ts < ?`,
      )
      .get(from, to) as KpiRow;
    const sessions = this.db
      .prepare(
        `WITH s AS (
           SELECT session_id, SUM(name = 'page_view') AS pv, MAX(ts) - MIN(ts) AS dur
           FROM events WHERE ts >= ? AND ts < ? GROUP BY session_id
         )
         SELECT SUM(pv = 1) * 1.0 / NULLIF(SUM(pv >= 1), 0) AS bounce,
                AVG(CASE WHEN dur > 0 THEN dur END) / 1000.0 AS avgSec
         FROM s`,
      )
      .get(from, to) as SessionRow;
    const pageViews = totals.pageViews ?? 0;
    return {
      visitors: totals.visitors,
      sessions: totals.sessions,
      pageViews,
      pagesPerSession: totals.sessions > 0 ? round(pageViews / totals.sessions, 1) : 0,
      bounceRate: round(sessions.bounce ?? 0, 3),
      avgSessionSeconds: Math.round(sessions.avgSec ?? 0),
    };
  }

  summary(days: number, now: number, utcOffsetSeconds: number): AnalyticsSummary {
    const to = now;
    const from = to - days * DAY_MS;
    const span = to - from;
    const range = [from, to] as const;

    const dailyRows = this.db
      .prepare(
        `SELECT date(ts / 1000 + ?, 'unixepoch') AS day, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions
         FROM events WHERE ts >= ? AND ts < ? GROUP BY day`,
      )
      .all(utcOffsetSeconds, ...range) as Array<{ day: string; visitors: number; sessions: number }>;

    const sources = this.db
      .prepare(
        `SELECT COALESCE(json_extract(props, '$.source'), 'direct') AS source, COUNT(DISTINCT session_id) AS sessions
         FROM events WHERE name = 'session_start' AND ts >= ? AND ts < ? GROUP BY source ORDER BY sessions DESC LIMIT ${TOP}`,
      )
      .all(...range) as AnalyticsSummary["sources"];

    const devices = this.db
      .prepare(
        `SELECT device, COUNT(DISTINCT session_id) AS sessions FROM events WHERE ts >= ? AND ts < ?
         GROUP BY device ORDER BY sessions DESC`,
      )
      .all(...range) as AnalyticsSummary["devices"];

    const stepRows = this.db
      .prepare(
        `SELECT name, COUNT(DISTINCT session_id) AS sessions FROM events
         WHERE ts >= ? AND ts < ? AND name IN ('product_view', 'add_to_cart', 'cart_view', 'checkout_view') GROUP BY name`,
      )
      .all(...range) as Array<{ name: FunnelStep; sessions: number }>;
    const kpis = this.kpis(from, to);
    const stepCount = (step: FunnelStep) => stepRows.find((row) => row.name === step)?.sessions ?? 0;
    const funnel: AnalyticsSummary["funnel"] = [
      { step: "visit", sessions: kpis.sessions },
      { step: "product_view", sessions: stepCount("product_view") },
      { step: "add_to_cart", sessions: stepCount("add_to_cart") },
      { step: "cart_view", sessions: stepCount("cart_view") },
      { step: "checkout_view", sessions: stepCount("checkout_view") },
    ];

    const productRows = (having: string, order: string) =>
      this.db
        .prepare(
          `SELECT CAST(json_extract(props, '$.productId') AS INTEGER) AS productId,
                  COALESCE(MAX(json_extract(props, '$.name')), '') AS name,
                  SUM(name = 'product_view') AS views, SUM(name = 'add_to_cart') AS adds
           FROM events
           WHERE ts >= ? AND ts < ? AND name IN ('product_view', 'add_to_cart') AND json_extract(props, '$.productId') IS NOT NULL
           GROUP BY productId HAVING ${having} ORDER BY ${order} LIMIT ${TOP}`,
        )
        .all(...range) as Array<{ productId: number; name: string; views: number; adds: number }>;
    const topProducts = productRows("views > 0", "views DESC, adds DESC");
    const viewedNeverAdded = productRows("views > 0 AND adds = 0", "views DESC").map(({ productId, name, views }) => ({ productId, name, views }));

    const soldOut = this.db
      .prepare(
        `SELECT CAST(json_extract(props, '$.productId') AS INTEGER) AS productId,
                COALESCE(MAX(json_extract(props, '$.name')), '') AS name,
                SUM(name = 'product_view' AND json_extract(props, '$.inStock') = 0) AS views,
                SUM(name = 'back_in_stock_signup') AS signups
         FROM events
         WHERE ts >= ? AND ts < ? AND json_extract(props, '$.productId') IS NOT NULL
           AND ((name = 'product_view' AND json_extract(props, '$.inStock') = 0) OR name = 'back_in_stock_signup')
         GROUP BY productId ORDER BY views DESC, signups DESC LIMIT ${TOP}`,
      )
      .all(...range) as AnalyticsSummary["soldOut"];

    const searchTotals = this.db
      .prepare(
        `SELECT COUNT(*) AS total, SUM(json_extract(props, '$.results') = 0) AS zero FROM events WHERE name = 'search' AND ts >= ? AND ts < ?`,
      )
      .get(...range) as { total: number; zero: number | null };
    const topSearches = this.db
      .prepare(
        `SELECT json_extract(props, '$.query') AS query, COUNT(*) AS count, AVG(json_extract(props, '$.results')) AS avgResults
         FROM events WHERE name = 'search' AND ts >= ? AND ts < ? AND json_extract(props, '$.query') IS NOT NULL
         GROUP BY query ORDER BY count DESC LIMIT ${TOP}`,
      )
      .all(...range) as Array<{ query: string; count: number; avgResults: number | null }>;
    const zeroSearches = this.db
      .prepare(
        `SELECT json_extract(props, '$.query') AS query, COUNT(*) AS count FROM events
         WHERE name = 'search' AND json_extract(props, '$.results') = 0 AND ts >= ? AND ts < ? AND json_extract(props, '$.query') IS NOT NULL
         GROUP BY query ORDER BY count DESC LIMIT ${TOP}`,
      )
      .all(...range) as Array<{ query: string; count: number }>;

    const sorting = this.db
      .prepare(
        `SELECT json_extract(props, '$.orderby') || ':' || json_extract(props, '$.order') AS option, COUNT(*) AS count
         FROM events WHERE name = 'sort_change' AND ts >= ? AND ts < ? AND json_extract(props, '$.orderby') IS NOT NULL
         GROUP BY option ORDER BY count DESC`,
      )
      .all(...range) as AnalyticsSummary["sorting"];
    const pagination = this.db
      .prepare(
        `SELECT COUNT(*) AS changes, COALESCE(MAX(json_extract(props, '$.page')), 1) AS deepestPage
         FROM events WHERE name = 'page_change' AND ts >= ? AND ts < ?`,
      )
      .get(...range) as { changes: number; deepestPage: number };

    const clicks = this.db
      .prepare(
        `SELECT json_extract(props, '$.id') AS id, COUNT(*) AS count FROM events
         WHERE name = 'click' AND ts >= ? AND ts < ? AND json_extract(props, '$.id') IS NOT NULL GROUP BY id ORDER BY count DESC LIMIT 12`,
      )
      .all(...range) as AnalyticsSummary["clicks"];

    const topPages = this.db
      .prepare(
        `SELECT path, COUNT(*) AS views FROM events WHERE name = 'page_view' AND ts >= ? AND ts < ? GROUP BY path ORDER BY views DESC LIMIT ${TOP}`,
      )
      .all(...range) as AnalyticsSummary["topPages"];

    const demo = this.db.prepare("SELECT 1 AS found FROM events WHERE demo = 1 AND ts >= ? AND ts < ? LIMIT 1").get(...range);

    return {
      range: { from, to, days },
      hasDemoData: Boolean(demo),
      kpis,
      previous: this.kpis(from - span, from),
      daily: fillDays(dailyRows, from, days, utcOffsetSeconds),
      sources,
      devices,
      funnel,
      topProducts,
      viewedNeverAdded,
      soldOut: soldOut.map((row) => ({ ...row, views: row.views ?? 0, signups: row.signups ?? 0 })),
      searches: {
        total: searchTotals.total,
        zeroResultRate: searchTotals.total > 0 ? round((searchTotals.zero ?? 0) / searchTotals.total, 3) : 0,
        top: topSearches.map((row) => ({ query: row.query, count: row.count, avgResults: round(row.avgResults ?? 0, 1) })),
        zeroResults: zeroSearches,
      },
      sorting,
      pagination,
      clicks,
      topPages,
      cart: this.cart(range, kpis.sessions),
      problems: this.problems(range),
      speed: this.speed(range),
      engagement: this.engagement(range, kpis.sessions),
    };
  }

  private cart(range: readonly [number, number], sessions: number): CartInsights {
    const flags = this.db
      .prepare(
        `WITH s AS (
           SELECT session_id, MAX(name = 'add_to_cart') AS added, MAX(name = 'cart_view') AS cartView, MAX(name = 'checkout_view') AS checkout
           FROM events WHERE ts >= ? AND ts < ? GROUP BY session_id
         )
         SELECT SUM(added) AS added, SUM(cartView) AS cartView, SUM(checkout) AS checkout, SUM(added = 1 AND checkout = 0) AS abandoned FROM s`,
      )
      .get(...range) as { added: number | null; cartView: number | null; checkout: number | null; abandoned: number | null };
    const coupons = this.db
      .prepare(`SELECT COUNT(*) AS total, SUM(json_extract(props, '$.ok') = 0) AS failed FROM events WHERE name = 'coupon_try' AND ts >= ? AND ts < ?`)
      .get(...range) as { total: number; failed: number | null };
    const shipping = this.db
      .prepare(
        `SELECT json_extract(props, '$.method') AS method, COUNT(*) AS count FROM events
         WHERE name = 'shipping_select' AND ts >= ? AND ts < ? AND json_extract(props, '$.method') IS NOT NULL
         GROUP BY method ORDER BY count DESC LIMIT ${TOP}`,
      )
      .all(...range) as CartInsights["shipping"];
    const fields = this.db
      .prepare(
        `SELECT json_extract(props, '$.field') AS field, COUNT(DISTINCT session_id) AS sessions FROM events
         WHERE name = 'checkout_field' AND ts >= ? AND ts < ? AND json_extract(props, '$.field') IS NOT NULL
         GROUP BY field ORDER BY sessions DESC LIMIT 20`,
      )
      .all(...range) as CartInsights["checkoutFields"];
    const added = flags.added ?? 0;
    return {
      addedToCartSessions: added,
      cartViewSessions: flags.cartView ?? 0,
      checkoutSessions: flags.checkout ?? 0,
      abandonmentRate: sessions > 0 && added > 0 ? round((flags.abandoned ?? 0) / added, 3) : 0,
      couponTries: { total: coupons.total, failed: coupons.failed ?? 0 },
      shipping,
      checkoutFields: fields,
    };
  }

  private problems(range: readonly [number, number]): Problems {
    const errors = this.db
      .prepare(
        `SELECT json_extract(props, '$.kind') AS kind, COALESCE(json_extract(props, '$.where'), '') AS "where", COUNT(*) AS count FROM events
         WHERE name = 'error' AND ts >= ? AND ts < ? AND json_extract(props, '$.kind') IN ('api', 'image', 'script')
         GROUP BY kind, "where" ORDER BY count DESC LIMIT ${TOP}`,
      )
      .all(...range) as Problems["errors"];
    const notFound = this.db
      .prepare(`SELECT path, COUNT(*) AS count FROM events WHERE name = 'not_found' AND ts >= ? AND ts < ? GROUP BY path ORDER BY count DESC LIMIT ${TOP}`)
      .all(...range) as Problems["notFound"];
    return { errors, notFound };
  }

  private speed(range: readonly [number, number]): Speed {
    const rows = this.db
      .prepare(
        `SELECT path, device, json_extract(props, '$.value') AS value FROM events
         WHERE name = 'perf' AND json_extract(props, '$.metric') = 'lcp' AND json_extract(props, '$.value') > 0 AND ts >= ? AND ts < ?
         LIMIT 20000`,
      )
      .all(...range) as Array<{ path: string; device: "mobile" | "tablet" | "desktop"; value: number }>;
    const values = rows.map((row) => row.value);
    const group = <K extends string>(key: (row: (typeof rows)[number]) => K) => {
      const map = new Map<K, number[]>();
      for (const row of rows) map.set(key(row), [...(map.get(key(row)) ?? []), row.value]);
      return map;
    };
    return {
      samples: values.length,
      lcpMedianMs: Math.round(percentile(values, 50)),
      lcpP75Ms: Math.round(percentile(values, 75)),
      slowShare: values.length > 0 ? round(values.filter((value) => value > 2500).length / values.length, 3) : 0,
      byDevice: [...group((row) => row.device)].map(([device, list]) => ({ device, medianMs: Math.round(percentile(list, 50)), samples: list.length })),
      slowestPages: [...group((row) => row.path)]
        .filter(([, list]) => list.length >= 3)
        .map(([path, list]) => ({ path, p75Ms: Math.round(percentile(list, 75)), samples: list.length }))
        .sort((a, b) => b.p75Ms - a.p75Ms)
        .slice(0, TOP),
    };
  }

  private engagement(range: readonly [number, number], sessions: number): Engagement {
    const returning = this.db
      .prepare(`SELECT SUM(json_extract(props, '$.returning') = 1) AS returningCount, COUNT(*) AS total FROM events WHERE name = 'session_start' AND ts >= ? AND ts < ?`)
      .get(...range) as { returningCount: number | null; total: number };
    const scrollRows = this.db
      .prepare(`SELECT json_extract(props, '$.pct') AS pct, COUNT(*) AS pageViews FROM events WHERE name = 'scroll_depth' AND ts >= ? AND ts < ? GROUP BY pct`)
      .all(...range) as Array<{ pct: number; pageViews: number }>;
    const timeOnPage = this.db
      .prepare(
        `SELECT path, AVG(json_extract(props, '$.seconds')) AS avgSeconds, COUNT(*) AS samples FROM events
         WHERE name = 'page_time' AND ts >= ? AND ts < ? GROUP BY path HAVING samples >= 3 ORDER BY avgSeconds DESC LIMIT ${TOP}`,
      )
      .all(...range) as Array<{ path: string; avgSeconds: number; samples: number }>;
    const rage = this.db
      .prepare(
        `SELECT json_extract(props, '$.target') AS target, COUNT(*) AS count FROM events WHERE name = 'rage_click' AND ts >= ? AND ts < ?
         AND json_extract(props, '$.target') IS NOT NULL GROUP BY target ORDER BY count DESC LIMIT ${TOP}`,
      )
      .all(...range) as Engagement["rageClicks"];
    const reached = (pct: 25 | 50 | 75 | 100) => scrollRows.find((row) => row.pct === pct)?.pageViews ?? 0;
    return {
      returningShare: returning.total > 0 && sessions > 0 ? round((returning.returningCount ?? 0) / returning.total, 3) : 0,
      scroll: ([25, 50, 75, 100] as const).map((pct) => ({ pct, pageViews: reached(pct) })),
      timeOnPage: timeOnPage.map((row) => ({ path: row.path, avgSeconds: round(row.avgSeconds, 1), samples: row.samples })),
      rageClicks: rage,
    };
  }
}

/** Percentile by linear interpolation. An empty list gives 0. */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return sorted[low]! + (sorted[high]! - sorted[low]!) * (index - low);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dayKey(ms: number, utcOffsetSeconds: number): string {
  return new Date(ms + utcOffsetSeconds * 1000).toISOString().slice(0, 10);
}

/** One row per calendar day (shifted by the Israel offset), so quiet days show as zero instead of disappearing. */
function fillDays(
  rows: Array<{ day: string; visitors: number; sessions: number }>,
  from: number,
  days: number,
  utcOffsetSeconds: number,
): AnalyticsSummary["daily"] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const result: AnalyticsSummary["daily"] = [];
  const seen = new Set<string>();
  for (let index = 0; index <= days; index += 1) {
    const day = dayKey(from + index * DAY_MS, utcOffsetSeconds);
    if (seen.has(day)) continue;
    seen.add(day);
    const row = byDay.get(day);
    result.push({ day, visitors: row?.visitors ?? 0, sessions: row?.sessions ?? 0 });
  }
  return result;
}
