import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContrastMode = "off" | "dark" | "yellow";
export type ColorBlindMode = "off" | "protanopia" | "deuteranopia" | "tritanopia";
export type CursorMode = "off" | "black" | "white";

export type A11yState = {
  keyboard: boolean;
  screenReader: boolean;
  stopMotion: boolean;
  fontScale: 0 | 1 | 2 | 3;
  contrast: ContrastMode;
  colorBlind: ColorBlindMode;
  readableFont: boolean;
  cursor: CursorMode;
  zoom: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  showAlts: boolean;
  setKeyboard: (value: boolean) => void;
  setScreenReader: (value: boolean) => void;
  setStopMotion: (value: boolean) => void;
  cycleFont: () => void;
  cycleContrast: () => void;
  cycleColorBlind: () => void;
  setReadableFont: (value: boolean) => void;
  cycleCursor: () => void;
  setZoom: (value: boolean) => void;
  setHighlightLinks: (value: boolean) => void;
  setHighlightHeadings: (value: boolean) => void;
  setShowAlts: (value: boolean) => void;
  reset: () => void;
};

const defaults = {
  keyboard: false,
  screenReader: false,
  stopMotion: false,
  fontScale: 0 as const,
  contrast: "off" as const,
  colorBlind: "off" as const,
  readableFont: false,
  cursor: "off" as const,
  zoom: false,
  highlightLinks: false,
  highlightHeadings: false,
  showAlts: false,
};

const fontCycle: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
const contrastCycle: ContrastMode[] = ["off", "dark", "yellow"];
const colorBlindCycle: ColorBlindMode[] = ["off", "protanopia", "deuteranopia", "tritanopia"];
const cursorCycle: CursorMode[] = ["off", "black", "white"];

function nextOf<T>(list: T[], current: T) {
  return list[(list.indexOf(current) + 1) % list.length] as T;
}

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      ...defaults,
      setKeyboard: (keyboard) => set({ keyboard }),
      setScreenReader: (screenReader) => set({ screenReader }),
      setStopMotion: (stopMotion) => set({ stopMotion }),
      cycleFont: () => set((state) => ({ fontScale: nextOf(fontCycle, state.fontScale) })),
      cycleContrast: () => set((state) => ({ contrast: nextOf(contrastCycle, state.contrast) })),
      cycleColorBlind: () => set((state) => ({ colorBlind: nextOf(colorBlindCycle, state.colorBlind) })),
      setReadableFont: (readableFont) => set({ readableFont }),
      cycleCursor: () => set((state) => ({ cursor: nextOf(cursorCycle, state.cursor) })),
      setZoom: (zoom) => set({ zoom }),
      setHighlightLinks: (highlightLinks) => set({ highlightLinks }),
      setHighlightHeadings: (highlightHeadings) => set({ highlightHeadings }),
      setShowAlts: (showAlts) => set({ showAlts }),
      reset: () => set({ ...defaults }),
    }),
    { name: "batshi.a11y" },
  ),
);
