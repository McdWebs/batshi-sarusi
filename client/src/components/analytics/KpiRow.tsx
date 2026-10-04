import { Box, Typography } from "@mui/material";
import type { Kpis } from "../../api/types";
import { changeVersus, formatCount, formatDecimal, formatDuration, formatPercent, type Change } from "../../analytics/labels";
import { chartInk, tabular } from "./shared";

type Kpi = {
  label: string;
  value: string;
  caption: string;
  current: number;
  previous: number;
  /** True when a lower number is the good direction (bounce rate). */
  lowerIsBetter?: boolean;
};

function ChangeLine({ change, lowerIsBetter, previousLabel }: { change: Change | null; lowerIsBetter?: boolean; previousLabel: string }) {
  if (!change) return <Typography sx={{ fontSize: 12, color: "text.secondary", minHeight: 18 }}>אין נתוני השוואה</Typography>;
  if (change.kind === "new") return <Typography sx={{ fontSize: 12, fontWeight: 700, color: lowerIsBetter ? "text.secondary" : chartInk.good, minHeight: 18 }}>חדש <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>{previousLabel}</Box></Typography>;
  if (change.kind === "same") return <Typography sx={{ fontSize: 12, color: "text.secondary", minHeight: 18 }}>ללא שינוי {previousLabel}</Typography>;
  const up = change.percent > 0;
  const good = lowerIsBetter ? !up : up;
  const spoken = `${up ? "עלייה" : "ירידה"} של ${Math.abs(change.percent)} אחוז ${previousLabel}${good ? ", שינוי טוב" : ", שינוי לא טוב"}`;
  return (
    <Typography sx={{ fontSize: 12, minHeight: 18, ...tabular }}>
      <Box component="span" aria-hidden="true" sx={{ fontWeight: 700, color: good ? chartInk.good : chartInk.worse }}>
        {up ? "▲" : "▼"} {Math.abs(change.percent)}%
      </Box>
      <Box component="span" aria-hidden="true" sx={{ color: "text.secondary" }}> {previousLabel}</Box>
      <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{spoken}</Box>
    </Typography>
  );
}

export function KpiRow({ kpis, previous, previousLabel }: { kpis: Kpis; previous: Kpis; previousLabel: string }) {
  const items: Kpi[] = [
    { label: "מבקרים", value: formatCount(kpis.visitors), caption: "אנשים שונים שביקרו באתר.", current: kpis.visitors, previous: previous.visitors },
    { label: "כניסות לאתר", value: formatCount(kpis.sessions), caption: "כל פעם שמישהו נכנס. אותו אדם יכול להיכנס כמה פעמים.", current: kpis.sessions, previous: previous.sessions },
    { label: "דפים לביקור", value: formatDecimal(kpis.pagesPerSession), caption: "כמה דפים רואים בכל כניסה, בממוצע.", current: kpis.pagesPerSession, previous: previous.pagesPerSession },
    { label: "נטישה מיידית", value: formatPercent(kpis.bounceRate), caption: "כניסות שנגמרו אחרי דף אחד. נמוך יותר עדיף.", current: kpis.bounceRate, previous: previous.bounceRate, lowerIsBetter: true },
    { label: "זמן ממוצע בביקור", value: formatDuration(kpis.avgSessionSeconds), caption: "כמה זמן אנשים נשארים, בכניסות שבהן עשו יותר מפעולה אחת.", current: kpis.avgSessionSeconds, previous: previous.avgSessionSeconds },
  ];
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
        columnGap: { xs: 2.5, md: 3 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.label}
          sx={{
            position: "relative",
            py: 2,
            // On a phone the first number leads across the full row, the rest pair up beneath it.
            gridColumn: { xs: index === 0 ? "1 / -1" : "auto", md: "auto" },
            borderBottom: { xs: "1px solid", md: "none" },
            borderColor: "divider",
          }}
        >
          <Typography component="dt" sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
            {item.label}
          </Typography>
          <Typography component="dd" sx={{ m: 0, mt: 0.25, fontSize: { xs: 30, md: 32 }, fontWeight: 700, lineHeight: 1.15, ...tabular }}>
            {item.value}
          </Typography>
          <Box component="dd" sx={{ m: 0, mt: 0.25 }}>
            <ChangeLine change={changeVersus(item.current, item.previous)} lowerIsBetter={item.lowerIsBetter} previousLabel={previousLabel} />
          </Box>
          <Typography component="dd" sx={{ m: 0, mt: 0.5, fontSize: 12, lineHeight: 1.45, color: "text.secondary" }}>
            {item.caption}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
