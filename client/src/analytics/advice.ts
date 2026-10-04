import type { AnalyticsSummary } from "../api/types";
import { safeDecode, shortImagePath } from "../components/analytics/insights";
import {
  CHECKOUT_FIELD_ORDER,
  changeVersus,
  checkoutFieldLabel,
  clickLabel,
  errorKindLabel,
  formatPercent,
  productLabel,
  rangeInfo,
  sourceLabel,
} from "./labels";

/**
 * Turns the dashboard numbers into a few plain sentences for the shop owner: what to look at first. Every rule has a
 * minimum amount of data, so a handful of visits never produces an alarming message.
 */

export type InsightTone = "problem" | "attention" | "good" | "info";
export type InsightTab = "visitors" | "products" | "searches" | "buying" | "health";

export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  /** The tab with the full numbers behind this message. */
  tab: InsightTab;
  /** Higher is more important inside the same tone. */
  weight: number;
};

export const MAX_INSIGHTS = 6;
const TONE_RANK: Record<InsightTone, number> = { problem: 0, attention: 1, good: 2, info: 3 };

export function times(count: number): string {
  return count === 1 ? "פעם אחת" : `${count} פעמים`;
}

export function people(count: number): string {
  return count === 1 ? "אדם אחד" : `${count} אנשים`;
}

function clip(text: string, max = 40): string {
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function seconds(ms: number): string {
  return (Math.round(ms / 100) / 10).toString().replace(/\.0$/, "");
}

export function buildInsights(summary: AnalyticsSummary): Insight[] {
  const { kpis, previous, cart, searches, soldOut, problems, speed, engagement } = summary;
  if (kpis.sessions === 0) return [];
  const found: Insight[] = [];
  const add = (insight: Insight) => found.push(insight);
  const previousLabel = rangeInfo(summary.range.days).previous;

  // Searches that found nothing: customers telling the shop exactly what they want.
  const zero = searches.zeroResults[0];
  if (zero && searches.total >= 5 && (searches.zeroResultRate >= 0.05 || zero.count >= 3)) {
    const others = searches.zeroResults.length - 1;
    add({
      id: "zero-search",
      tone: searches.zeroResultRate >= 0.2 ? "problem" : "attention",
      title: `אנשים חיפשו "${clip(zero.query)}" ולא מצאו`,
      detail: `${times(zero.count)} בתקופה הזו${others > 0 ? `, ועוד ${others === 1 ? "חיפוש אחד אחר" : `${others} חיפושים אחרים`} בלי תוצאות` : ""}. אם יש לכם מוצר כזה, כדאי להוסיף אותו או לקרוא לו בשם שהלקוחות מחפשים.`,
      tab: "searches",
      weight: 70 + Math.min(zero.count, 20),
    });
  }

  // A sold-out product that people still want.
  const hot = [...soldOut]
    .filter((product) => product.signups > 0 || product.views >= 3)
    .sort((a, b) => b.signups * 3 + b.views - (a.signups * 3 + a.views))[0];
  if (hot) {
    add({
      id: "sold-out-demand",
      tone: "attention",
      title: `"${clip(productLabel(hot.name, hot.productId))}" אזל, ואנשים מבקשים אותו`,
      detail: `${hot.views} צפיות${hot.signups > 0 ? ` ו-${hot.signups} בקשות לעדכון כשיחזור` : ""}. כדאי להזמין ממנו עוד.`,
      tab: "products",
      weight: 80 + Math.min(hot.signups, 15),
    });
  }

  // People who put something in the cart and never reached checkout.
  if (cart.addedToCartSessions >= 5 && cart.abandonmentRate >= 0.5) {
    add({
      id: "cart-abandonment",
      tone: cart.abandonmentRate >= 0.7 ? "problem" : "attention",
      title: `${formatPercent(cart.abandonmentRate)} מהאנשים שהוסיפו לעגלה לא הגיעו לקופה`,
      detail: `${people(cart.addedToCartSessions)} הוסיפו מוצר לעגלה בתקופה הזו. כדאי לבדוק שעלות המשלוח ברורה ושקל להמשיך מהעגלה אל התשלום.`,
      tab: "buying",
      weight: 90,
    });
  }

  // The biggest fall between two checkout fields, in the order of the real form.
  const byField = new Map(cart.checkoutFields.map((row) => [row.field, row.sessions]));
  const steps = CHECKOUT_FIELD_ORDER.filter((field) => byField.has(field)).map((field) => ({ field, sessions: byField.get(field) ?? 0 }));
  let worst: { from: number; to: { field: string; sessions: number }; drop: number } | null = null;
  for (let index = 1; index < steps.length; index += 1) {
    const before = steps[index - 1]!;
    const after = steps[index]!;
    const drop = before.sessions > 0 ? (before.sessions - after.sessions) / before.sessions : 0;
    if (before.sessions >= 10 && drop >= 0.25 && (!worst || drop > worst.drop)) worst = { from: before.sessions, to: after, drop };
  }
  if (worst) {
    add({
      id: "checkout-drop",
      tone: "attention",
      title: `בטופס התשלום, הרבה אנשים עוצרים ב"${checkoutFieldLabel(worst.to.field)}"`,
      detail: `${worst.from} אנשים התחילו למלא את הטופס, ורק ${worst.to.sessions} מהם הגיעו לשדה הזה. אולי כדאי לפשט אותו או להסביר למה צריך אותו.`,
      tab: "buying",
      weight: 75,
    });
  }

  // Coupons that do not work.
  if (cart.couponTries.total >= 5 && cart.couponTries.failed / cart.couponTries.total >= 0.4) {
    add({
      id: "coupon-fails",
      tone: "attention",
      title: `${cart.couponTries.failed} מתוך ${cart.couponTries.total} ניסיונות קופון נכשלו`,
      detail: "בדקו שהקופונים שאתם מפרסמים עובדים, ושהקוד כתוב באותה צורה בכל מקום.",
      tab: "buying",
      weight: 60,
    });
  }

  // Looked at a lot, never put in a cart.
  const dud = summary.viewedNeverAdded.find((product) => product.views >= 5);
  if (dud) {
    add({
      id: "viewed-never-added",
      tone: "attention",
      title: `"${clip(productLabel(dud.name, dud.productId))}" נצפה ${times(dud.views)} ואף אחד לא הוסיף אותו לעגלה`,
      detail: "אולי כדאי לבדוק את התמונה, המחיר או התיאור.",
      tab: "products",
      weight: 55,
    });
  }

  // Speed, with enough measurements to mean something.
  if (speed.samples >= 30) {
    const mobile = speed.byDevice.find((row) => row.device === "mobile");
    if (speed.lcpP75Ms > 2500) {
      add({
        id: "slow-site",
        tone: speed.lcpP75Ms > 4000 ? "problem" : "attention",
        title: `האתר איטי אצל ${formatPercent(speed.slowShare)} מהמבקרים`,
        detail: `בטלפונים התוכן מופיע אחרי בערך ${seconds(mobile?.medianMs ?? speed.lcpMedianMs)} שניות. מעל 2.5 שניות כבר מרגישים את זה.`,
        tab: "health",
        weight: 65,
      });
    } else {
      add({
        id: "fast-site",
        tone: "good",
        title: "האתר נטען מהר",
        detail: `ברוב הטעינות התוכן הראשי מופיע תוך ${seconds(speed.lcpP75Ms)} שניות.`,
        tab: "health",
        weight: 30,
      });
    }
  }

  // Pages that do not exist.
  const missing = problems.notFound[0];
  if (missing && missing.count >= 3) {
    add({
      id: "not-found",
      tone: "attention",
      title: `${people(missing.count)} הגיעו לדף שלא קיים`,
      detail: `הכתובת ${safeDecode(missing.path)}. כנראה קישור שבור, וכדאי להפנות אותו לדף קיים.`,
      tab: "health",
      weight: 50,
    });
  }

  // Things that broke.
  const totalErrors = problems.errors.reduce((sum, row) => sum + row.count, 0);
  if (totalErrors >= 5) {
    const top = problems.errors[0]!;
    add({
      id: "errors",
      tone: totalErrors >= 30 ? "problem" : "attention",
      title: `נרשמו ${totalErrors} תקלות באתר`,
      detail: `הנפוצה ביותר: ${errorKindLabel(top.kind)}, ${top.kind === "image" ? shortImagePath(top.where) : top.where} (${times(top.count)}).`,
      tab: "health",
      weight: 58,
    });
  }

  // Repeated clicks on something that does not respond.
  const rage = engagement.rageClicks[0];
  if (rage && rage.count >= 3) {
    add({
      id: "rage-click",
      tone: "attention",
      title: `אנשים לוחצים שוב ושוב על "${clickLabel(rage.target)}"`,
      detail: `${times(rage.count)} בתקופה הזו. בדרך כלל זה אומר שמשהו נראה כמו כפתור ולא עובד.`,
      tab: "visitors",
      weight: 45,
    });
  }

  // Good news or bad news about the number of visitors.
  const trend = changeVersus(kpis.visitors, previous.visitors);
  if (trend?.kind === "change" && previous.visitors >= 20 && Math.abs(trend.percent) >= 15) {
    add(
      trend.percent > 0
        ? {
            id: "visitors-up",
            tone: "good",
            title: `יותר מבקרים: ${trend.percent}% יותר ${previousLabel}`,
            detail: `${people(kpis.visitors)} ביקרו באתר, לעומת ${people(previous.visitors)} קודם.`,
            tab: "visitors",
            weight: 40,
          }
        : {
            id: "visitors-down",
            tone: "attention",
            title: `פחות מבקרים: ירידה של ${Math.abs(trend.percent)}% ${previousLabel}`,
            detail: `${people(kpis.visitors)} ביקרו באתר, לעומת ${people(previous.visitors)} קודם. כדאי לבדוק אם הפרסום או הפוסטים היו פחות פעילים.`,
            tab: "visitors",
            weight: 85,
          },
    );
  }

  // Where visitors come from.
  const topSource = summary.sources[0];
  if (topSource && kpis.sessions >= 20 && topSource.sessions / kpis.sessions >= 0.3) {
    add({
      id: "top-source",
      tone: "info",
      title: `המקור הכי חזק: ${sourceLabel(topSource.source)} (${formatPercent(topSource.sessions / kpis.sessions)} מהכניסות)`,
      detail: "כאן כדאי להמשיך להשקיע, ובמקורות החלשים יותר לבדוק מה אפשר לשפר.",
      tab: "visitors",
      weight: 20,
    });
  }

  return found
    .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone] || b.weight - a.weight)
    .slice(0, MAX_INSIGHTS);
}

/** The one or two sentences at the top of the page. */
export function buildSummary(summary: AnalyticsSummary): string {
  const { kpis, previous, cart } = summary;
  const span = rangeInfo(summary.range.days).span;
  if (kpis.sessions === 0) return "עדיין אין נתונים לתקופה הזו.";

  const change = changeVersus(kpis.visitors, previous.visitors);
  const comparison = rangeInfo(summary.range.days).previous;
  const trend =
    change?.kind === "change"
      ? `, ${Math.abs(change.percent)}% ${change.percent > 0 ? "יותר" : "פחות"} ${comparison}`
      : change?.kind === "same"
        ? `, כמו ${comparison.replace("לעומת ", "")}`
        : "";
  const first = `${span} ביקרו באתר ${people(kpis.visitors)}${trend}.`;

  const added = cart.addedToCartSessions;
  if (added === 0) return `${first} אף אחד לא הוסיף מוצר לעגלה.`;
  const reached = cart.checkoutSessions;
  return `${first} ${people(added)} הוסיפו מוצר לעגלה${reached > 0 ? `, ו-${reached} הגיעו עד דף התשלום` : ", ואף אחד לא הגיע עד דף התשלום"}.`;
}
