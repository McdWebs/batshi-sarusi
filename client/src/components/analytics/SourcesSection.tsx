import { Box, Typography } from "@mui/material";
import type { AnalyticsSummary } from "../../api/types";
import { deviceLabel, formatCount, formatPercent, sourceLabel } from "../../analytics/labels";
import { BarList, chartInk, EmptyNote, SubSection, tabular } from "./shared";

export function SourcesSection({ sources, devices, totalSessions }: { sources: AnalyticsSummary["sources"]; devices: AnalyticsSummary["devices"]; totalSessions: number }) {
  const deviceTotal = devices.reduce((sum, row) => sum + row.sessions, 0);
  return (
    <Box sx={{ display: "grid", gap: 4, minWidth: 0 }}>
      <SubSection title="מאיפה מגיעים" hint="מאיפה הגיעה כל כניסה לאתר, ואיזה חלק זה מכל הכניסות.">
        {sources.length === 0 ? (
          <EmptyNote>אין עדיין מידע על מקורות הכניסה.</EmptyNote>
        ) : (
          <BarList
            total={totalSessions}
            items={sources.map((row) => ({ key: row.source, label: sourceLabel(row.source), value: row.sessions }))}
          />
        )}
      </SubSection>

      <SubSection title="באיזה מכשיר" hint="מובייל, מחשב או טאבלט.">
        {deviceTotal === 0 ? (
          <EmptyNote>אין עדיין מידע על מכשירים.</EmptyNote>
        ) : (
          <>
            {/* One bar split into shares, with the shares also written out below, so no colour is needed to read it. */}
            <Box sx={{ display: "flex", gap: "2px", height: 12, bgcolor: "#FFFBF5" }} aria-hidden="true">
              {devices
                .filter((row) => row.sessions > 0)
                .map((row, index) => (
                  <Box key={row.device} sx={{ flex: row.sessions, bgcolor: chartInk.bar, opacity: [1, 0.6, 0.32][index] ?? 0.32, borderRadius: "2px" }} />
                ))}
            </Box>
            <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1.25, p: 0, display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
              {devices.map((row, index) => (
                <Box component="li" key={row.device} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14 }}>
                  <Box aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: chartInk.bar, opacity: [1, 0.6, 0.32][index] ?? 0.32 }} />
                  <span>{deviceLabel(row.device)}</span>
                  <Typography component="span" sx={{ fontSize: 14, ...tabular }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>{formatPercent(row.sessions / deviceTotal)}</Box>
                    <Box component="span" sx={{ color: "text.secondary" }}> ({formatCount(row.sessions)})</Box>
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </SubSection>
    </Box>
  );
}
