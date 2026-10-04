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

const SHIPPING_LABELS: Record<string, string> = {
  local_pickup: "איסוף עצמי",
  pisol_extended_flat_shipping: "משלוח עד הבית",
  free_shipping: "משלוח חינם",
  flat_rate: "תעריף קבוע",
};

export function shippingLabel(method: string): string {
  return SHIPPING_LABELS[method] ?? method;
}

/** The checkout form fields in the order they appear on the page. */
export const CHECKOUT_FIELD_ORDER = ["first_name", "last_name", "company", "address1", "address2", "postcode", "city", "phone", "email", "notes"] as const;

const CHECKOUT_FIELD_LABELS: Record<string, string> = {
  first_name: "שם פרטי",
  last_name: "שם משפחה",
  company: "שם החברה",
  address1: "כתובת רחוב",
  address2: "דירה/קומה",
  postcode: "מיקוד",
  city: "עיר",
  phone: "טלפון",
  email: "אימייל",
  notes: "הערות להזמנה",
};

export function checkoutFieldLabel(field: string): string {
  return CHECKOUT_FIELD_LABELS[field] ?? field;
}

export function errorKindLabel(kind: string): string {
  if (kind === "api") return "שרת";
  if (kind === "image") return "תמונה";
  if (kind === "script") return "שגיאת דפדפן";
  return kind;
}

/** Milliseconds as seconds with one decimal: "1.8 שנ׳". */
export function formatSeconds(ms: number): string {
  const seconds = Math.max(0, ms) / 1000;
  return `${new Intl.NumberFormat("he-IL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(seconds)} שנ׳`;
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

/** Below this many in the earlier period a percentage says nothing (3 to 9 is "+200%"), so no comparison is shown. */
const MIN_COMPARABLE = 20;

/** Relative change versus the previous period. Null when there is not enough in the earlier period to compare. */
export function changeVersus(current: number, previous: number): Change | null {
  if (previous < MIN_COMPARABLE) return null;
  const exact = ((current - previous) / previous) * 100;
  // A change under 2 percent is noise, so it reads as "no change" instead of a worrying arrow.
  if (Math.abs(exact) < 2) return { kind: "same" };
  return { kind: "change", percent: Math.round(exact) };
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

/** The five detail tabs on the dashboard, in the order shown. The id is what `?tab=` holds in the URL. */
export const TAB_OPTIONS = [
  { id: "visitors", label: "מבקרים" },
  { id: "products", label: "מוצרים" },
  { id: "searches", label: "חיפושים" },
  { id: "buying", label: "קנייה" },
  { id: "health", label: "מהירות ותקלות" },
] as const;

export type AnalyticsTabId = (typeof TAB_OPTIONS)[number]["id"];

export const DEFAULT_TAB: AnalyticsTabId = "visitors";

export function parseTab(value: string | null): AnalyticsTabId {
  return TAB_OPTIONS.find((option) => option.id === value)?.id ?? DEFAULT_TAB;
}

/** Milliseconds written out for a sentence: "2.1 שניות". */
export function secondsText(ms: number): string {
  const seconds = Math.round(Math.max(0, ms) / 100) / 10;
  if (seconds === 1) return "שנייה אחת";
  return `${formatDecimal(seconds)} שניות`;
}

/** Seconds written out for a sentence: "12 שניות" or "1:20 דקות". */
export function durationWords(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return total === 1 ? "שנייה אחת" : `${total} שניות`;
  return `${formatDuration(total)} דקות`;
}
