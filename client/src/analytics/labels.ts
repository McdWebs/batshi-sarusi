import type { FunnelStep } from "../api/types";
import { findInfluencer } from "../content/influencers";

/** Hebrew labels and number formatters for the owner analytics dashboard. */

export const RANGE_OPTIONS = [
  { days: 1, label: "היום", previous: "לעומת היממה הקודמת", span: "ב-24 השעות האחרונות" },
  { days: 7, label: "7 ימים", previous: "לעומת 7 הימים הקודמים", span: "ב-7 הימים האחרונים" },
  { days: 30, label: "30 ימים", previous: "לעומת 30 הימים הקודמים", span: "ב-30 הימים האחרונים" },
  { days: 90, label: "90 ימים", previous: "לעומת 90 הימים הקודמים", span: "ב-90 הימים האחרונים" },
] as const;

export const DEFAULT_DAYS = 7;

export function parseDays(value: string | null): number {
  const parsed = Number(value);
  return RANGE_OPTIONS.some((option) => option.days === parsed) ? parsed : DEFAULT_DAYS;
}

export function rangeInfo(days: number) {
  return RANGE_OPTIONS.find((option) => option.days === days) ?? RANGE_OPTIONS[1];
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "אינסטגרם",
  google: "גוגל",
  facebook: "פייסבוק",
  whatsapp: "וואטסאפ",
  direct: "כניסה ישירה",
};

export function sourceLabel(source: string): string {
  const known = SOURCE_LABELS[source];
  if (known) return known;
  if (source.startsWith("influencer:")) {
    const ref = source.slice("influencer:".length);
    const influencer = findInfluencer(ref);
    return `משפיענית: ${influencer?.name ?? ref}`;
  }
  return source;
}

export function deviceLabel(device: string): string {
  if (device === "mobile") return "מובייל";
  if (device === "desktop") return "מחשב";
  if (device === "tablet") return "טאבלט";
  return device;
}

const SORT_LABELS: Record<string, string> = {
  "date:desc": "חדש יותר",
  "price:asc": "מחיר: זול ליקר",
  "price:desc": "מחיר: יקר לזול",
  "popularity:desc": "הכי נמכרים",
};

export function sortLabel(option: string): string {
  return SORT_LABELS[option] ?? option;
}

const CLICK_LABELS: Record<string, string> = {
  "menu:sale": "תפריט: מבצעים",
  "menu:shop": "תפריט: הכל",
  "hero:cta": "כפתור הבאנר הראשי",
  "category:card": "כרטיס קטגוריה",
  "look:pin": "סיכה בשופ דה לוק",
  "contact:whatsapp": "וואטסאפ",
  "footer:contact": "צור קשר בתחתית",
  "menu:departments": "תפריט: מחלקות",
  "menu:collections": "תפריט: קולקציות",
  "hero:shop": "כפתור הבאנר: לכל החנות",
  "header:logo": "הלוגו",
  "header:search": "סמל החיפוש",
  "header:cart": "סמל העגלה",
};

export function clickLabel(id: string): string {
  return CLICK_LABELS[id] ?? id;
}

export function pageLabel(path: string): string {
  return path === "/" || path === "" ? "דף הבית" : path;
}

export const FUNNEL_STEPS: Array<{ step: FunnelStep; label: string; hint: string }> = [
  { step: "visit", label: "כניסה לאתר", hint: "כל הכניסות" },
  { step: "product_view", label: "צפייה במוצר", hint: "נכנסו לדף של מוצר" },
  { step: "add_to_cart", label: "הוספה לעגלה", hint: "הוסיפו מוצר לעגלה" },
  { step: "cart_view", label: "צפייה בעגלה", hint: "פתחו את העגלה" },
  { step: "checkout_view", label: "מעבר לקופה", hint: "הגיעו לדף הקופה" },
];

export function productLabel(name: string, productId: number): string {
  return name.trim() ? name : `מוצר #${productId}`;
}

const numberFormat = new Intl.NumberFormat("he-IL");

export function formatCount(value: number): string {
  return numberFormat.format(value);
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(value);
}

/** A share between 0 and 1 as a whole percent. Tiny non-zero shares show as "<1%" so they do not look like zero. */
export function formatPercent(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return "0%";
  const percent = share * 100;
  if (percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
}

/** Seconds as m:ss, or "12 שנ׳" under a minute. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total} שנ׳`;
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

/** "2026-10-04" to "4.10". */
export function formatShortDay(day: string): string {
  const [, month, date] = day.split("-");
  if (!month || !date) return day;
  return `${Number(date)}.${Number(month)}`;
}

export type Change = { kind: "new" } | { kind: "same" } | { kind: "change"; percent: number };

/** Relative change versus the previous period. Null when there is nothing to compare. */
export function changeVersus(current: number, previous: number): Change | null {
  if (previous <= 0) return current > 0 ? { kind: "new" } : null;
  const percent = Math.round(((current - previous) / previous) * 100);
  return percent === 0 ? { kind: "same" } : { kind: "change", percent };
}

function csvCell(value: string | number): string {
  let text = String(value);
  // Stop spreadsheets from running typed text as a formula (customers type the search queries).
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV text with a UTF-8 BOM so Excel shows Hebrew correctly. */
export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
