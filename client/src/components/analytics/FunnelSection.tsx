import { Box, Typography } from "@mui/material";
import type { AnalyticsSummary } from "../../api/types";
import { FUNNEL_STEPS, formatCount, formatPercent } from "../../analytics/labels";
import { chartInk, SubSection, tabular } from "./shared";

export function FunnelSection({ funnel, totalSessions }: { funnel: AnalyticsSummary["funnel"]; totalSessions: number }) {
  const bySteps = new Map(funnel.map((row) => [row.step, row.sessions]));
  const visits = bySteps.get("visit") || totalSessions;
  return (
    <SubSection
      title="איך אנשים מתקדמים בקנייה"
      hint="כמה כניסות הגיעו לכל שלב, ואיזה חלק זה מכל הכניסות. כל שלב נספר בנפרד: אפשר להוסיף לעגלה ישר מכרטיס מוצר בלי לפתוח את המוצר, ולכן השלבים לא תמיד קטנים בהדרגה."
    >
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {FUNNEL_STEPS.map((step) => {
          const sessions = bySteps.get(step.step) ?? 0;
          const share = visits > 0 ? Math.min(1, sessions / visits) : 0;
          return (
            <Box component="li" key={step.step} sx={{ py: 1.1, borderTop: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: "1px solid", borderColor: "divider" } }}>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{step.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{step.hint}</Typography>
                </Box>
                <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", ...tabular }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>{formatCount(sessions)}</Box>
                  <Box component="span" sx={{ color: "text.secondary" }}> · {formatPercent(share)}</Box>
                </Typography>
              </Box>
              <Box sx={{ mt: 0.75, height: 8, bgcolor: chartInk.track }} aria-hidden="true">
                <Box sx={{ height: "100%", width: `${sessions > 0 ? Math.max(1, share * 100) : 0}%`, bgcolor: chartInk.bar, borderStartEndRadius: 4, borderEndEndRadius: 4 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </SubSection>
  );
}
