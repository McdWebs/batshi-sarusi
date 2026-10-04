import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useConsentStore } from "../consent/store";
import { startTracker, stopAndForget, trackPageView } from "./tracker";

/** Mounted once in the app shell. Sends a page view whenever the path changes, and stops when consent is withdrawn. */
export function AnalyticsRoot() {
  const { pathname } = useLocation();
  const ready = useConsentStore((state) => state.ready);
  const statistics = useConsentStore((state) => state.preferences.statistics);
  const lastPath = useRef<string | null>(null);
  const wasAllowed = useRef(false);

  useEffect(() => {
    startTracker();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!statistics && wasAllowed.current) {
      stopAndForget();
      lastPath.current = null;
    }
    wasAllowed.current = statistics;
  }, [ready, statistics]);

  useEffect(() => {
    if (!ready || !statistics || lastPath.current === pathname) return;
    const from = lastPath.current;
    lastPath.current = pathname;
    trackPageView(from);
  }, [pathname, ready, statistics]);

  return null;
}
