import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { buildSummary } from "../../analytics/advice";
import { changeVersus, formatCount, rangeInfo } from "../../analytics/labels";
import type { AnalyticsSummary } from "../../api/types";
import { ink, serif, tabular, visuallyHidden } from "./shared";

/** "▲ 9%" in green or "▼ 9%" in terracotta. Nothing when there is nothing to compare with. */
function Change({ current, previous, span }: { current: number; previous: number; span: string }) {
  const change = changeVersus(current, previous);
  if (!change || change.kind === "new") return <Box sx={{ minHeight: 20 }} />;
  if (change.kind === "same") return <Typography sx={{ minHeight: 20, color: ink.muted, fontSize: 14 }}>ללא שינוי</Typography>;
  const up = change.percent > 0;
  return (
    <Typography sx={{ minHeight: 20, fontSize: 14, fontWeight: 700, color: up ? ink.good : ink.problem, ...tabular }}>
      <span aria-hidden="true">
        {up ? "▲" : "▼"} {Math.abs(change.percent)}%
      </span>
      <Box component="span" sx={visuallyHidden}>
        {Math.abs(change.percent)}% {up ? "יותר" : "פחות"} {span}
      </Box>
    </Typography>
  );
}

function Figure({ label, value, caption, change }: { label: string; value: number; caption: string; change?: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="dt" sx={{ fontSize: 14, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, mt: 0.5, fontFamily: serif, fontWeight: 600, fontSize: { xs: 36, sm: 44 }, lineHeight: 1.1, ...tabular }}>
        {formatCount(value)}
      </Typography>
      <Box component="dd" sx={{ m: 0 }}>
        {change ?? <Box sx={{ minHeight: 20 }} />}
      </Box>
      <Typography component="dd" sx={{ m: 0, mt: 0.25, color: ink.muted, fontSize: 12, lineHeight: 1.4 }}>
        {caption}
      </Typography>
    </Box>
  );
}

/** The answer in two sentences and the only three big numbers on the first screen. */
export function SummaryBlock({ summary }: { summary: AnalyticsSummary }) {
  const { kpis, previous, cart } = summary;
  const range = rangeInfo(summary.range.days);
  return (
    <Box component="section" aria-labelledby="analytics-summary" sx={{ mt: 6, bgcolor: ink.paper, border: `1px solid ${ink.rule}`, p: { xs: 2.5, md: 4 } }}>
      <Typography id="analytics-summary" variant="h2" sx={{ fontSize: 16, fontWeight: 600, color: ink.muted }}>
        בקצרה
      </Typography>
      <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.15fr) minmax(0, 1fr)" }, columnGap: { md: 8 }, rowGap: 4, alignItems: "center" }}>
      <Typography sx={{ fontFamily: serif, fontSize: { xs: 22, md: 26 }, lineHeight: 1.5 }}>{buildSummary(summary)}</Typography>
      <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: { xs: 1.5, sm: 3 } }}>
        <Figure label="מבקרים" value={kpis.visitors} caption="אנשים שונים" change={<Change current={kpis.visitors} previous={previous.visitors} span={range.previous} />} />
        <Figure label="הוסיפו לעגלה" value={cart.addedToCartSessions} caption="אנשים עם מוצר בעגלה" />
        <Figure label="הגיעו לקופה" value={cart.checkoutSessions} caption="אנשים שפתחו את דף התשלום" />
      </Box>
      </Box>
    </Box>
  );
}
