import { deleteCookie } from "./cookies";

declare global {
  interface Window {
    sbjs?: {
      init: (options: {
        lifetime: number;
        session_length: number;
        base64: boolean;
        timezone_offset: string;
      }) => void;
      get?: unknown;
    };
  }
}

const SBJS_COOKIES = [
  "sbjs_current",
  "sbjs_current_add",
  "sbjs_first",
  "sbjs_first_add",
  "sbjs_session",
  "sbjs_udata",
  "sbjs_migrations",
  "sbjs_promo",
] as const;

let scriptPromise: Promise<void> | null = null;

function loadSourcebuster(): Promise<void> {
  if (window.sbjs) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-batshi-sourcebuster]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sourcebuster load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "/vendor/sourcebuster.min.js";
    script.async = true;
    script.dataset.batshiSourcebuster = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sourcebuster load failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function clearSbjsCookies() {
  for (const name of SBJS_COOKIES) {
    deleteCookie(name);
  }
}

/**
 * Same behavior as WooCommerce Order Attribution + WPConsent on the old site:
 * statistics consent → sbjs.init (session cookies); reject → clear sbjs_*.
 */
export async function applyStatisticsConsent(allowed: boolean) {
  if (!allowed) {
    clearSbjsCookies();
    return;
  }
  try {
    await loadSourcebuster();
    window.sbjs?.init({
      // WooCommerce default forces session-only cookies (~0 months lifetime)
      lifetime: 0.00001,
      session_length: 30,
      base64: false,
      timezone_offset: "0",
    });
  } catch {
    // Tracking is best-effort; never block the storefront.
  }
}
