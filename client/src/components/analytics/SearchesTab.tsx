import { Box } from "@mui/material";
import { times } from "../../analytics/advice";
import { formatCount, formatPercent } from "../../analytics/labels";
import type { AnalyticsSummary } from "../../api/types";
import { CsvButton, Group, NameRows, Quiet, Sentence } from "./shared";

export function SearchesTab({ summary }: { summary: AnalyticsSummary }) {
  const { searches } = summary;
  if (searches.total === 0) return <Quiet>עדיין לא חיפשו באתר בתקופה הזו.</Quiet>;
  const count = searches.total === 1 ? "חיפוש אחד" : `${formatCount(searches.total)} חיפושים`;
  return (
    <>
      <Box sx={{ gridColumn: "1 / -1" }}>
        <Sentence>
          {searches.zeroResultRate > 0 ? `${count}, ${formatPercent(searches.zeroResultRate)} מהם בלי תוצאות` : `${count}, וכולם מצאו תוצאות`}
        </Sentence>
      </Box>

      <Group
        title="מה מחפשים"
        action={
          <CsvButton
            filename="batshi-top-searches.csv"
            headers={["חיפוש", "מספר חיפושים", "ממוצע תוצאות"]}
            rows={searches.top.map((row) => [row.query, row.count, row.avgResults])}
          />
        }
      >
        {searches.top.length === 0 ? (
          <Quiet>אין חיפושים להצגה.</Quiet>
        ) : (
          <NameRows items={searches.top.map((row) => ({ key: row.query, label: row.query, stat: times(row.count) }))} />
        )}
      </Group>

      <Group title="חיפושים בלי תוצאות" hint="אלה מוצרים או מילים שלקוחות רוצים והחנות לא מציגה. אולי כדאי להוסיף מוצר, לשנות שם או להוסיף מילת חיפוש.">
        {searches.zeroResults.length === 0 ? (
          <Quiet>כל החיפושים מצאו משהו.</Quiet>
        ) : (
          <NameRows items={searches.zeroResults.map((row) => ({ key: row.query, label: row.query, stat: times(row.count) }))} />
        )}
      </Group>
    </>
  );
}
