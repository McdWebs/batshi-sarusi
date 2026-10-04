import { Box, Typography } from "@mui/material";
import type { AnalyticsSummary } from "../../api/types";
import { formatCount, formatDecimal, formatPercent } from "../../analytics/labels";
import { CsvButton, EmptyNote, RankedRows, Section, SubSection, tabular, TwoColumns } from "./shared";

export function SearchSection({ searches }: { searches: AnalyticsSummary["searches"] }) {
  return (
    <Section title="חיפושים באתר" intro="מה אנשים מקלידים בחיפוש. זה הדבר הכי ישיר שלקוחות אומרים לכם על מה הם רוצים.">
      <Box sx={{ display: "flex", gap: { xs: 4, md: 8 }, flexWrap: "wrap", mb: 3.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>חיפושים</Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, ...tabular }}>{formatCount(searches.total)}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", maxWidth: 200 }}>כמה פעמים חיפשו באתר.</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>חיפושים בלי תוצאות</Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, ...tabular }}>{searches.total > 0 ? formatPercent(searches.zeroResultRate) : "-"}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", maxWidth: 240 }}>איזה חלק מהחיפושים לא מצא כלום. נמוך יותר עדיף.</Typography>
        </Box>
      </Box>

      {searches.total === 0 ? (
        <EmptyNote>עדיין לא חיפשו באתר בטווח הזה.</EmptyNote>
      ) : (
        <TwoColumns>
          <SubSection
            title="החיפושים הנפוצים"
            hint="המילה, כמה פעמים חיפשו אותה, וכמה תוצאות האתר הראה בממוצע."
            action={
              <CsvButton
                filename="batshi-top-searches.csv"
                headers={["חיפוש", "מספר חיפושים", "ממוצע תוצאות"]}
                rows={searches.top.map((row) => [row.query, row.count, row.avgResults])}
              />
            }
          >
            {searches.top.length === 0 ? (
              <EmptyNote>אין חיפושים להצגה.</EmptyNote>
            ) : (
              <RankedRows
                rows={searches.top.map((row) => ({
                  key: row.query,
                  label: row.query,
                  stats: [
                    { value: formatCount(row.count), caption: "חיפושים" },
                    { value: formatDecimal(row.avgResults), caption: "תוצאות" },
                  ],
                }))}
              />
            )}
          </SubSection>

          <SubSection
            title="חיפושים שלא מצאו כלום"
            hint="אלה מוצרים או מילים שלקוחות רוצים, והחנות לא מציגה. אולי כדאי להוסיף מוצר, לשנות שם או להוסיף מילת חיפוש."
            action={
              <CsvButton
                filename="batshi-zero-result-searches.csv"
                headers={["חיפוש", "מספר חיפושים"]}
                rows={searches.zeroResults.map((row) => [row.query, row.count])}
              />
            }
          >
            {searches.zeroResults.length === 0 ? (
              <EmptyNote>כל החיפושים מצאו משהו.</EmptyNote>
            ) : (
              <RankedRows
                rows={searches.zeroResults.map((row) => ({
                  key: row.query,
                  label: row.query,
                  stats: [{ value: formatCount(row.count), caption: "חיפושים" }],
                }))}
              />
            )}
          </SubSection>
        </TwoColumns>
      )}
    </Section>
  );
}
