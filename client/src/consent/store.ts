import { create } from "zustand";
import { readConsentPreferences, writeConsentPreferences } from "./cookies";
import { applyStatisticsConsent } from "./sourcebuster";
import type { ConsentPreferences } from "./types";

type ConsentState = {
  ready: boolean;
  decided: boolean;
  preferences: ConsentPreferences;
  preferencesOpen: boolean;
  init: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (prefs: Omit<ConsentPreferences, "essential">) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const defaults: ConsentPreferences = {
  essential: true,
  statistics: false,
  marketing: false,
};

function persist(prefs: ConsentPreferences) {
  writeConsentPreferences(prefs);
  applyStatisticsConsent(prefs.statistics);
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  ready: false,
  decided: false,
  preferences: defaults,
  preferencesOpen: false,
  init: () => {
    if (get().ready) return;
    const existing = readConsentPreferences();
    if (existing) {
      set({ ready: true, decided: true, preferences: existing });
      applyStatisticsConsent(existing.statistics);
      return;
    }
    set({ ready: true, decided: false, preferences: defaults });
  },
  acceptAll: () => {
    const prefs: ConsentPreferences = { essential: true, statistics: true, marketing: true };
    persist(prefs);
    set({ preferences: prefs, decided: true, preferencesOpen: false });
  },
  rejectAll: () => {
    const prefs: ConsentPreferences = { essential: true, statistics: false, marketing: false };
    persist(prefs);
    set({ preferences: prefs, decided: true, preferencesOpen: false });
  },
  save: (partial) => {
    const prefs: ConsentPreferences = { essential: true, ...partial };
    persist(prefs);
    set({ preferences: prefs, decided: true, preferencesOpen: false });
  },
  openPreferences: () => set({ preferencesOpen: true }),
  closePreferences: () => set({ preferencesOpen: false }),
}));
