import { Box, Typography } from "@mui/material";
import type { AnalyticsSummary } from "../../api/types";
import { clickLabel, formatCount, pageLabel, sortLabel } from "../../analytics/labels";
import { BarList, EmptyNote, RankedRows, Section, SubSection, tabular, TwoColumns } from "./shared";

export function BrowsingSection({ sorting, pagination, clicks, topPages }: Pick<AnalyticsSummary, "sorting" | "pagination" | "clicks" | "topPages">) {
  const sortTotal = sorting.reduce((sum, row) => sum + row.count, 0);
  const clickTotal = clicks.reduce((sum, row) => sum + row.count, 0);
  return (
    <Section title="איך מסתובבים באתר" intro="איך אנשים ממיינים את המוצרים, על מה הם לוחצים, ואילו דפים הם פותחים הכי הרבה.">
      <TwoColumns>
        <SubSection title="סדר המוצרים" hint="איך אנשים בוחרים למיין את הקטלוג.">
          {sorting.length === 0 ? (
            <EmptyNote>עדיין לא שינו את סדר המוצרים בטווח הזה.</EmptyNote>
          ) : (
            <BarList total={sortTotal} valueNoun="פעמים" items={sorting.map((row) => ({ key: row.option, label: sortLabel(row.option), value: row.count }))} />
          )}
        </SubSection>

        <SubSection title="מעבר בין עמודים" hint="כמה פעמים עברו לעמוד אחר בקטלוג, ועד איזה עמוד הגיעו.">
          {pagination.changes === 0 ? (
            <EmptyNote>עדיין לא עברו בין עמודי הקטלוג.</EmptyNote>
          ) : (
            <Box sx={{ display: "flex", gap: 6, py: 1, borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider" }}>
              <Box>
                <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, ...tabular }}>{formatCount(pagination.changes)}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>מעברים בין עמודים</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, ...tabular }}>{formatCount(pagination.deepestPage)}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>העמוד העמוק ביותר</Typography>
              </Box>
            </Box>
          )}
        </SubSection>

        <SubSection title="על מה לוחצים" hint="הכפתורים והקישורים שנלחצו הכי הרבה, ואיזה חלק זה מכל הלחיצות שנמדדו.">
          {clicks.length === 0 ? (
            <EmptyNote>עדיין אין לחיצות שנמדדו.</EmptyNote>
          ) : (
            <BarList total={clickTotal} valueNoun="לחיצות" items={clicks.map((row) => ({ key: row.id, label: clickLabel(row.id), value: row.count }))} />
          )}
        </SubSection>

        <SubSection title="הדפים הכי נפתחים" hint="כמה פעמים נפתח כל דף באתר.">
          {topPages.length === 0 ? (
            <EmptyNote>עדיין אין צפיות בדפים.</EmptyNote>
          ) : (
            <RankedRows
              rows={topPages.map((row) => ({
                key: row.path,
                label: pageLabel(row.path),
                stats: [{ value: formatCount(row.views), caption: "צפיות" }],
              }))}
            />
          )}
        </SubSection>
      </TwoColumns>
    </Section>
  );
}
