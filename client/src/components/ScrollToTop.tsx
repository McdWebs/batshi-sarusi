import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_PREFIX = "batshi:scroll:";

function locationKey(pathname: string, search: string, hash: string) {
  return `${STORAGE_PREFIX}${pathname}${search}${hash}`;
}

function navigationType() {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type ?? "navigate";
}

function readSavedScroll(key: string) {
  const raw = sessionStorage.getItem(key);
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

let reloadRestoreStarted = false;

function startReloadScrollRestore(key: string) {
  if (reloadRestoreStarted) return;
  if (navigationType() !== "reload") return;
  reloadRestoreStarted = true;

  const saved = readSavedScroll(key);
  if (saved == null) return;

  let attempts = 0;
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
  };

  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchmove", cancel, { passive: true });
  window.addEventListener("keydown", cancel);

  const interval = window.setInterval(() => {
    if (cancelled || attempts >= 40) {
      window.clearInterval(interval);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
      window.removeEventListener("keydown", cancel);
      return;
    }

    window.scrollTo(0, saved);
    attempts += 1;

    if (Math.abs(window.scrollY - saved) < 2) {
      window.clearInterval(interval);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
      window.removeEventListener("keydown", cancel);
    }
  }, 50);
}

export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const key = locationKey(pathname, search, hash);
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    let frame = 0;
    const persist = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        persist();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      persist();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [key]);

  useLayoutEffect(() => {
    startReloadScrollRestore(key);

    const previousKey = previousKeyRef.current;
    if (previousKey === null) {
      previousKeyRef.current = key;
      return;
    }

    if (previousKey === key) return;
    previousKeyRef.current = key;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [key, hash]);

  return null;
}
