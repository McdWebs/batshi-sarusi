import { Box } from "@mui/material";
import { checkoutFieldLabel, formatCount, formatPercent, shippingLabel } from "../../analytics/labels";
import type { AnalyticsSummary, FunnelStep } from "../../api/types";
import { orderCheckoutFields } from "./insights";
import { BarRows, Disclosure, Group, ink, Quiet, Sentence } from "./shared";

/** The four steps worth showing (the cart view is skipped: people can add to the cart without opening it). */
const STEPS: Array<{ step: FunnelStep; label: string }> = [
  { step: "visit", label: "נכנסו לאתר" },
  { step: "product_view", label: "צפו במוצר" },
  { step: "add_to_cart", label: "הוסיפו לעגלה" },
  { step: "checkout_view", label: "פתחו את דף התשלום" },
];

export function BuyingTab({ summary }: { summary: AnalyticsSummary }) {
  const { cart, funnel, kpis } = summary;
  const bySteps = new Map(funnel.map((row) => [row.step, row.sessions]));
  const visits = Math.max(kpis.sessions, bySteps.get("visit") ?? 0);
  const shippingTotal = cart.shipping.reduce((sum, row) => sum + row.count, 0);
  const fields = orderCheckoutFields(cart.checkoutFields);
  const fieldBase = Math.max(cart.checkoutSessions, ...fields.map((row) => row.sessions));
  const { total: tries, failed } = cart.couponTries;

  return (
    <>
      <Group title="מהכניסה ועד דף התשלום" hint="איזה חלק מהכניסות הגיע לכל שלב.">
        <BarRows total={visits} noun="כניסות" items={STEPS.map(({ step, label }) => ({ key: step, label, value: bySteps.get(step) ?? 0 }))} />
        {cart.addedToCartSessions > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Sentence>{`${formatPercent(cart.abandonmentRate)} מהאנשים שהוסיפו מוצר לעגלה לא הגיעו לדף התשלום.`}</Sentence>
          </Box>
        ) : null}
      </Group>

      <Group title="קופונים">
        {tries === 0 ? (
          <Quiet>עדיין לא ניסו להקליד קופון.</Quiet>
        ) : (
          <Sentence>{`${tries === 1 ? "ניסיון אחד" : `${formatCount(tries)} ניסיונות`} להקליד קופון, ${failed === 0 ? "אף אחד לא נכשל" : failed === 1 ? "אחד נכשל" : `${formatCount(failed)} נכשלו`}`}</Sentence>
        )}
      </Group>

      <Group title="איך בחרו משלוח">
        {cart.shipping.length === 0 ? (
          <Quiet>עדיין לא נבחרה אפשרות משלוח.</Quiet>
        ) : (
          <BarRows total={shippingTotal} noun="בחירות" items={cart.shipping.map((row) => ({ key: row.method, label: shippingLabel(row.method), value: row.count }))} />
        )}
      </Group>

      <Disclosure summary="איפה בטופס התשלום עוצרים">
        <Group title="כמה התחילו למלא כל שדה" hint="לפי הסדר שבו השדות מופיעים בטופס. איפה שהעמודות נהיות קצרות, שם אנשים מפסיקים.">
          {fields.length === 0 ? (
            <Quiet>עדיין לא התחילו למלא את טופס התשלום.</Quiet>
          ) : (
            <BarRows total={fieldBase} noun="כניסות" items={fields.map((row) => ({ key: row.field, label: checkoutFieldLabel(row.field), value: row.sessions }))} />
          )}
        </Group>
      </Disclosure>

      <Box component="p" sx={{ m: 0, gridColumn: "1 / -1", color: ink.muted, fontSize: 14, lineHeight: 1.6 }}>
        הזמנות והכנסות יופיעו כאן כשהחנות תתחבר להזמנות.
      </Box>
    </>
  );
}
