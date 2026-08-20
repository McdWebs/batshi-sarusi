export type ConsentCategory = "essential" | "statistics" | "marketing";

/** Same shape / cookie name as WPConsent on batshi-home.co.il */
export type ConsentPreferences = {
  essential: true;
  statistics: boolean;
  marketing: boolean;
};

export const CONSENT_COOKIE = "wpconsent_preferences";
export const CONSENT_DURATION_DAYS = 30;
export const CONSENT_SLUGS: ConsentCategory[] = ["essential", "statistics", "marketing"];
