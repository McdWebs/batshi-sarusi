import { apiUrl } from "../api/client";
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
  | "back_in_stock_signup";

type Prop = string | number | boolean | null;
type Props = Record<string, Prop>;
type QueuedEvent = { name: EventName; path: string; at: number; props: Props };

const VISITOR_KEY = "batshi.vid";
const SESSION_KEY = "batshi.sid";
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
const ONCE_PER_SECOND: ReadonlySet<EventName> = new Set(["page_view", "product_view", "cart_view", "checkout_view"]);
const lastSent = new Map<string, number>();

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

function enqueue(name: EventName, props: Props) {
  queue.push({ name, path: window.location.pathname, at: Date.now(), props });
  if (queue.length >= BATCH_MAX) {
    flush();
  } else if (flushTimer === undefined) {
    flushTimer = window.setTimeout(() => flush(), FLUSH_MS);
  }
}

/** Records one event. Does nothing without consent, and never throws into the page. */
export function track(name: EventName, props: Props = {}) {
  try {
    if (!statisticsAllowed() || isOwnerPath(window.location.pathname)) return;
    if (ONCE_PER_SECOND.has(name)) {
      const key = `${name}|${window.location.pathname}|${JSON.stringify(props)}`;
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
      });
    }
    enqueue(name, props);
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

/** Page views are sent by the router hook; this also restarts the scroll milestones for the new page. */
export function trackPageView(from: string | null) {
  reached.clear();
  track("page_view", from ? { from: from.slice(0, 100) } : {});
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

function onClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
  const id = target?.getAttribute("data-track");
  if (id) track("click", { id: id.slice(0, 60) });
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
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
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
