import { apiUrl, onApiFailure } from "../api/client";
import { useConsentStore } from "../consent/store";
import { classifySource, deviceFor, isOwnerPath } from "./sources";

export type EventName =
  | "session_start"
  | "page_view"
  | "scroll_depth"
  | "click"
  | "search"
  | "sort_change"
  | "page_change"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_view"
  | "checkout_view"
  | "back_in_stock_signup"
  | "coupon_try"
  | "shipping_select"
  | "checkout_field"
  | "error"
  | "not_found"
  | "perf"
  | "page_time"
  | "rage_click";

type Prop = string | number | boolean | null;
type Props = Record<string, Prop>;
type QueuedEvent = { name: EventName; path: string; at: number; props: Props };

const VISITOR_KEY = "batshi.vid";
const SESSION_KEY = "batshi.sid";
const VISITS_KEY = "batshi.visits";
const SESSION_GAP_MS = 30 * 60_000;
const FLUSH_MS = 4_000;
const BATCH_MAX = 20;
const MILESTONES = [25, 50, 75, 100];

let queue: QueuedEvent[] = [];
let flushTimer: number | undefined;
let started = false;
let memoryVisitor: string | null = null;
let memorySession: { id: string; last: number } | null = null;
const reached = new Set<number>();
// Page-level events that should count once even if a component runs its effect twice (React dev mode does).
const ONCE_PER_SECOND: ReadonlySet<EventName> = new Set(["page_view", "product_view", "cart_view", "checkout_view", "not_found"]);
const lastSent = new Map<string, number>();

// Time on page counts only the time the tab is visible.
let pagePath: string | null = null;
let pageVisibleMs = 0;
let pageVisibleSince: number | null = null;

// Rage clicks: three clicks within a second, close together.
let recentClicks: Array<{ t: number; x: number; y: number }> = [];
let lastRage = 0;

// Largest Contentful Paint of the first page load, sent when the page is hidden or closed.
let lcpMs = 0;
let lcpSent = false;
let landingPath = "/";

const reportedErrors = new Set<string>();
const MAX_ERRORS_PER_LOAD = 12;

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Nothing is recorded unless the visitor accepted statistics cookies, and a browser "do not track" signal is honoured. */
export function statisticsAllowed(): boolean {
  const { ready, preferences } = useConsentStore.getState();
  if (!ready || !preferences.statistics) return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return false;
  return true;
}

function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    memoryVisitor ??= randomId();
    return memoryVisitor;
  }
}

/** A session ends after 30 quiet minutes. Returns whether this call started a new one. */
function ensureSession(now: number): { id: string; isNew: boolean } {
  let current: { id: string; last: number } | null = null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    current = raw ? (JSON.parse(raw) as { id: string; last: number }) : null;
  } catch {
    current = memorySession;
  }
  const isNew = !current || now - current.last > SESSION_GAP_MS;
  const next = { id: isNew || !current ? randomId() : current.id, last: now };
  memorySession = next;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // Falls back to the in-memory copy above.
  }
  return { id: next.id, isNew };
}

/** How many sessions this browser has had, so the dashboard can tell new visitors from returning ones. */
function countVisit(): number {
  try {
    const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
    return visits;
  } catch {
    return 1;
  }
}

function enqueue(name: EventName, props: Props, path = window.location.pathname) {
  queue.push({ name, path, at: Date.now(), props });
  if (queue.length >= BATCH_MAX) {
    flush();
  } else if (flushTimer === undefined) {
    flushTimer = window.setTimeout(() => flush(), FLUSH_MS);
  }
}

/** Records one event. Does nothing without consent, and never throws into the page. */
export function track(name: EventName, props: Props = {}, path?: string) {
  try {
    const eventPath = path ?? window.location.pathname;
    if (!statisticsAllowed() || isOwnerPath(eventPath)) return;
    if (ONCE_PER_SECOND.has(name)) {
      const key = `${name}|${eventPath}|${JSON.stringify(props)}`;
      const previous = lastSent.get(key) ?? 0;
      if (Date.now() - previous < 1_000) return;
      lastSent.set(key, Date.now());
    }
    const session = ensureSession(Date.now());
    if (session.isNew && name !== "session_start") {
      const source = classifySource({ search: window.location.search, referrer: document.referrer, host: window.location.hostname });
      enqueue("session_start", {
        source: source.source,
        medium: source.medium,
        campaign: source.campaign,
        referrer: source.referrerHost,
        landing: window.location.pathname.slice(0, 100),
        width: window.innerWidth,
        lang: navigator.language.slice(0, 12),
        returning: countVisit() > 1,
      });
    }
    enqueue(name, props, eventPath);
  } catch {
    // Analytics must never break the shop.
  }
}

/** Sends what is queued. On page close the browser's beacon is used so the last events are not lost. */
export function flush(useBeacon = false) {
  if (flushTimer !== undefined) {
    window.clearTimeout(flushTimer);
    flushTimer = undefined;
  }
  if (queue.length === 0 || !statisticsAllowed()) {
    queue = [];
    return;
  }
  while (queue.length > 0) {
    const events = queue.splice(0, 50);
    const body = JSON.stringify({
      visitorId: visitorId(),
      sessionId: ensureSession(Date.now()).id,
      device: deviceFor(window.innerWidth),
      events,
    });
    const url = apiUrl("/api/events");
    try {
      // text/plain keeps this a "simple" request, so it needs no CORS preflight (the server parses it as JSON).
      if (useBeacon && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=UTF-8" }));
      } else {
        void fetch(url, { method: "POST", body, headers: { "Content-Type": "text/plain;charset=UTF-8" }, keepalive: true }).catch(() => undefined);
      }
    } catch {
      // Best effort: a lost batch is better than a broken page.
    }
  }
}

function beginPage(path: string) {
  pagePath = path;
  pageVisibleMs = 0;
  pageVisibleSince = document.visibilityState === "visible" ? Date.now() : null;
}

/** Sends how long the visitor stayed on the page they are leaving (visible time only, capped at 10 minutes). */
function endPage() {
  if (!pagePath) return;
  const total = pageVisibleMs + (pageVisibleSince ? Date.now() - pageVisibleSince : 0);
  const seconds = Math.round(total / 1000);
  if (seconds >= 1) track("page_time", { seconds: Math.min(seconds, 600) }, pagePath);
  pagePath = null;
}

/** Page views are sent by the router hook; this also restarts the scroll milestones and the page timer. */
export function trackPageView(from: string | null) {
  endPage();
  reached.clear();
  beginPage(window.location.pathname);
  track("page_view", from ? { from: from.slice(0, 100) } : {});
}

function reportError(kind: "api" | "image" | "script", where: string, extra: Props = {}) {
  const key = `${kind}|${where}`;
  if (reportedErrors.has(key) || reportedErrors.size >= MAX_ERRORS_PER_LOAD) return;
  reportedErrors.add(key);
  track("error", { kind, where: where.slice(0, 100), ...extra });
}

/** A photo that could not be shown, even from the original address (or the resizer failed and the original was used). */
export function reportImageError(source: string, viaResizer = false) {
  let where = source;
  try {
    const url = new URL(source);
    const original = url.searchParams.get("url");
    where = (original ? new URL(original) : url).pathname.split("/").slice(-2).join("/");
  } catch {
    // Keep the raw value.
  }
  reportError("image", viaResizer ? `resizer: ${where}` : where);
}

function onScroll() {
  const height = document.documentElement.scrollHeight;
  if (height <= window.innerHeight + 40) return;
  const percent = ((window.scrollY + window.innerHeight) / height) * 100;
  for (const mark of MILESTONES) {
    if (percent >= mark - 1 && !reached.has(mark)) {
      reached.add(mark);
      track("scroll_depth", { pct: mark });
    }
  }
}

/** Names what was clicked without recording any text: the data-track id, or the tag (and the path for links). */
function describeTarget(element: Element | null): string {
  if (!element) return "page";
  const marked = element.closest("[data-track]")?.getAttribute("data-track");
  if (marked) return marked;
  const interactive = element.closest("a, button, input, select, textarea, [role='button']");
  if (!interactive) return element.tagName.toLowerCase();
  const tag = interactive.tagName.toLowerCase();
  if (tag === "a") {
    try {
      return `a:${new URL((interactive as HTMLAnchorElement).href).pathname}`.slice(0, 60);
    } catch {
      return "a";
    }
  }
  return tag;
}

function detectRageClick(event: MouseEvent) {
  const now = Date.now();
  recentClicks = [...recentClicks.filter((click) => now - click.t < 1_000), { t: now, x: event.clientX, y: event.clientY }];
  const close = recentClicks.every((click) => Math.hypot(click.x - event.clientX, click.y - event.clientY) < 40);
  if (recentClicks.length >= 3 && close && now - lastRage > 2_000) {
    lastRage = now;
    recentClicks = [];
    track("rage_click", { target: describeTarget(event.target instanceof Element ? event.target : null) });
  }
}

function onClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
  const id = target?.getAttribute("data-track");
  if (id) track("click", { id: id.slice(0, 60) });
  detectRageClick(event);
}

function sendPageLoadSpeed() {
  if (lcpSent || lcpMs <= 0) return;
  lcpSent = true;
  track("perf", { metric: "lcp", value: Math.round(lcpMs) }, landingPath);
}

/** Called once. Registers the page-wide listeners; each one checks consent again before recording. */
export function startTracker() {
  if (started) return;
  started = true;
  document.addEventListener("click", onClick, { capture: true });
  let scrollQueued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      window.setTimeout(() => {
        scrollQueued = false;
        onScroll();
      }, 250);
    },
    { passive: true },
  );
  landingPath = window.location.pathname;
  if (typeof PerformanceObserver !== "undefined") {
    try {
      new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) lcpMs = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Not supported in this browser: no speed sample from it.
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (pageVisibleSince) pageVisibleMs += Date.now() - pageVisibleSince;
      pageVisibleSince = null;
      sendPageLoadSpeed();
      flush(true);
    } else if (pagePath) {
      pageVisibleSince = Date.now();
    }
  });
  window.addEventListener("pagehide", () => {
    endPage();
    sendPageLoadSpeed();
    flush(true);
  });
  window.addEventListener("error", (event) => {
    if (event instanceof ErrorEvent) reportError("script", event.message || "error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportError("script", reason instanceof Error ? reason.message : "unhandled rejection");
  });
  onApiFailure((failure) => {
    if (failure.path.startsWith("/api/studio") || failure.path.startsWith("/api/events")) return;
    reportError("api", `${failure.method} ${failure.path}`, { status: failure.status });
  });
}

/** The visitor declined or withdrew consent: drop the queue, delete their stored events, and forget their ids. */
export function stopAndForget() {
  queue = [];
  if (flushTimer !== undefined) {
    window.clearTimeout(flushTimer);
    flushTimer = undefined;
  }
  let id: string | null = null;
  try {
    id = localStorage.getItem(VISITOR_KEY);
  } catch {
    id = memoryVisitor;
  }
  try {
    localStorage.removeItem(VISITOR_KEY);
    localStorage.removeItem(VISITS_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing stored.
  }
  memoryVisitor = null;
  memorySession = null;
  if (id) {
    void fetch(apiUrl("/api/events/forget"), {
      method: "POST",
      body: JSON.stringify({ visitorId: id }),
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      keepalive: true,
    }).catch(() => undefined);
  }
}
