import { useEffect } from "react";
import { useA11yStore } from "./store";
import "./accessibility.css";

export function AccessibilityRoot() {
  const keyboard = useA11yStore((state) => state.keyboard);
  const screenReader = useA11yStore((state) => state.screenReader);
  const stopMotion = useA11yStore((state) => state.stopMotion);
  const fontScale = useA11yStore((state) => state.fontScale);
  const contrast = useA11yStore((state) => state.contrast);
  const colorBlind = useA11yStore((state) => state.colorBlind);
  const readableFont = useA11yStore((state) => state.readableFont);
  const cursor = useA11yStore((state) => state.cursor);
  const zoom = useA11yStore((state) => state.zoom);
  const highlightLinks = useA11yStore((state) => state.highlightLinks);
  const highlightHeadings = useA11yStore((state) => state.highlightHeadings);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11yKeyboard = keyboard ? "on" : "off";
    root.dataset.a11ySr = screenReader ? "on" : "off";
    root.dataset.a11yMotion = stopMotion ? "on" : "off";
    root.dataset.a11yFont = String(fontScale);
    root.dataset.a11yContrast = contrast;
    root.dataset.a11yColor = colorBlind;
    root.dataset.a11yReadable = readableFont ? "on" : "off";
    root.dataset.a11yCursor = cursor;
    root.dataset.a11yZoom = zoom ? "on" : "off";
    root.dataset.a11yLinks = highlightLinks ? "on" : "off";
    root.dataset.a11yHeadings = highlightHeadings ? "on" : "off";
  }, [
    keyboard,
    screenReader,
    stopMotion,
    fontScale,
    contrast,
    colorBlind,
    readableFont,
    cursor,
    zoom,
    highlightLinks,
    highlightHeadings,
  ]);

  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <filter id="a11y-protanopia">
        <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0" />
      </filter>
      <filter id="a11y-deuteranopia">
        <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0" />
      </filter>
      <filter id="a11y-tritanopia">
        <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0" />
      </filter>
    </svg>
  );
}
