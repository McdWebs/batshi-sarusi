import { CONSENT_COOKIE, CONSENT_DURATION_DAYS, type ConsentPreferences } from "./types";

function cookieDomain(): string {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "";
  // Match WPConsent shared-consent off: host-only cookie (no Domain=)
  return "";
}

export function readCookie(name: string): string | null {
  const parts = `; ${document.cookie}`.split(`; ${name}=`);
  if (parts.length !== 2) return null;
  return parts.pop()?.split(";").shift() ?? null;
}

export function writeCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const domainPart = cookieDomain() ? ` domain=${cookieDomain()};` : "";
  // Same shape as WPConsent: JSON value, expires + path=/
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()};${domainPart} path=/`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=-999`;
  const host = window.location.hostname;
  document.cookie = `${name}=; path=/; max-age=-999; domain=.${host}`;
}

export function readConsentPreferences(): ConsentPreferences | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const decoded = (() => {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })();
    const parsed = JSON.parse(decoded) as Partial<ConsentPreferences>;
    return {
      essential: true,
      statistics: Boolean(parsed.statistics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

export function writeConsentPreferences(prefs: ConsentPreferences) {
  // WPConsent stores raw JSON (not URI-encoded) in wpconsent_preferences
  writeCookie(CONSENT_COOKIE, JSON.stringify(prefs), CONSENT_DURATION_DAYS);
}
