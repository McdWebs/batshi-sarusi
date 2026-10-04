/** Pure helpers for the tracker: where a visit came from, and what kind of device it is. */

export type SessionSource = {
  source: string;
  medium: string | null;
  campaign: string | null;
  referrerHost: string | null;
};

const SAFE = /[^a-z0-9_-]/g;

function clean(value: string | null, max = 40): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(SAFE, "").slice(0, max);
  return cleaned || null;
}

function hostOf(referrer: string): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

function fromHost(host: string): string {
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)(facebook|fb)\.com$/.test(host) || host === "fb.me" || host === "l.facebook.com") return "facebook";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return "whatsapp";
  return host.slice(0, 60);
}

const ALIASES: Record<string, string> = { ig: "instagram", insta: "instagram", fb: "facebook", wa: "whatsapp" };

/**
 * Order of trust: an influencer link (?ref=) beats UTM tags, which beat a Facebook click id, which beats the referrer.
 * A visit from the shop's own host counts as direct, and no data at all is direct too.
 */
export function classifySource(input: { search: string; referrer: string; host: string }): SessionSource {
  const params = new URLSearchParams(input.search);
  const referrerHost = hostOf(input.referrer);
  const ownHost = input.host.replace(/^www\./, "").toLowerCase();
  const external = referrerHost && referrerHost !== ownHost ? referrerHost : null;
  const medium = clean(params.get("utm_medium"));
  const campaign = clean(params.get("utm_campaign"));

  const ref = clean(params.get("ref"));
  if (ref) return { source: `influencer:${ref}`, medium, campaign, referrerHost: external };

  const utm = clean(params.get("utm_source"));
  if (utm) return { source: ALIASES[utm] ?? utm, medium, campaign, referrerHost: external };

  if (params.get("fbclid")) return { source: "facebook", medium, campaign, referrerHost: external };
  if (external) return { source: fromHost(external), medium, campaign, referrerHost: external };
  return { source: "direct", medium, campaign, referrerHost: null };
}

export function deviceFor(width: number): "mobile" | "tablet" | "desktop" {
  if (width < 600) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/** The owner's own pages are not part of the shop's traffic. */
export function isOwnerPath(pathname: string): boolean {
  return /^\/(studio|demand|analytics)(\/|$)/.test(pathname);
}
