import { Box, Typography } from "@mui/material";
import { times } from "../../analytics/advice";
import { clickLabel, deviceLabel, durationWords, formatCount, formatPercent, pageLabel, sortLabel, sourceLabel } from "../../analytics/labels";
import type { AnalyticsSummary } from "../../api/types";
import { safeDecode } from "./insights";
import { BarRows, Disclosure, Group, ink, NameRows, Quiet, Sentence, tabular } from "./shared";

const DEVICE_SHADES = [1, 0.62, 0.32];

/** One bar split between the devices, with the shares written underneath. */
function DeviceSplit({ devices }: { devices: AnalyticsSummary["devices"] }) {
  const total = devices.reduce((sum, row) => sum + row.sessions, 0);
  if (total === 0) return <Quiet>עדיין אין נתונים על המכשירים.</Quiet>;
  const rows = devices.filter((row) => row.sessions > 0);
  const spoken = rows.map((row) => `${deviceLabel(row.device)} ${formatPercent(row.sessions / total)}`).join(", ");
  return (
    <>
      <Box role="img" aria-label={spoken} sx={{ display: "flex", gap: "2px", height: 10, borderRadius: 5, overflow: "hidden" }}>
        {rows.map((row, index) => (
          <Box key={row.device} sx={{ flex: `${row.sessions} 0 0`, minWidth: 4, bgcolor: ink.accent, opacity: DEVICE_SHADES[index] ?? 0.2 }} />
        ))}
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0, display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 0.5 }}>
        {rows.map((row, index) => (
          <Typography component="li" key={row.device} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 14, ...tabular }}>
            <Box component="span" aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: ink.accent, opacity: DEVICE_SHADES[index] ?? 0.2 }} />
            {deviceLabel(row.device)}
            <Box component="span" sx={{ fontWeight: 700 }}>{formatPercent(row.sessions / total)}</Box>
          </Typography>
        ))}
      </Box>
    </>
  );
}

export function VisitorsTab({ summary }: { summary: AnalyticsSummary }) {
  const { kpis, sources, devices, engagement, topPages, clicks, sorting, pagination } = summary;
  const clickTotal = clicks.reduce((sum, row) => sum + row.count, 0);
  const sortTotal = sorting.reduce((sum, row) => sum + row.count, 0);
  const scroll = [...engagement.scroll].sort((a, b) => a.pct - b.pct);
  const hasScroll = kpis.pageViews > 0 && scroll.some((row) => row.pageViews > 0);

  return (
    <>
      <Group title="מאיפה הגיעו">
        {sources.length === 0 ? (
          <Quiet>עדיין אין נתונים על המקורות.</Quiet>
        ) : (
          <BarRows total={kpis.sessions} noun="כניסות" items={sources.map((row) => ({ key: row.source, label: sourceLabel(row.source), value: row.sessions }))} />
        )}
      </Group>

      <Group title="באיזה מכשיר">
        <DeviceSplit devices={devices} />
      </Group>

      <Group title="חדשים וחוזרים">
        <Sentence>
          {kpis.sessions === 0
            ? "עדיין אין נתונים."
            : engagement.returningShare > 0
              ? `${formatPercent(engagement.returningShare)} מהכניסות היו של אנשים שכבר ביקרו באתר`
              : "אף כניסה לא הייתה של אנשים שכבר ביקרו באתר"}
        </Sentence>
      </Group>

      <Group title="הדפים שהכי נצפו">
        {topPages.length === 0 ? (
          <Quiet>עדיין אין צפיות בדפים.</Quiet>
        ) : (
          <NameRows
            items={topPages.map((row) => ({
              key: row.path,
              label: pageLabel(safeDecode(row.path)),
              stat: `${formatCount(row.views)} צפיות`,
            }))}
          />
        )}
      </Group>

      <Disclosure summary="פרטים נוספים למתקדמים">
        <Group title="על מה לוחצים" hint="הכפתורים והקישורים שנלחצו הכי הרבה.">
          {clicks.length === 0 ? (
            <Quiet>עדיין אין לחיצות שנמדדו.</Quiet>
          ) : (
            <BarRows total={clickTotal} noun="לחיצות" items={clicks.map((row) => ({ key: row.id, label: clickLabel(row.id), value: row.count }))} />
          )}
        </Group>

        <Group title="איך ממיינים את המוצרים">
          {sorting.length === 0 ? (
            <Quiet>עדיין לא שינו את סדר המוצרים.</Quiet>
          ) : (
            <BarRows total={sortTotal} noun="פעמים" items={sorting.map((row) => ({ key: row.option, label: sortLabel(row.option), value: row.count }))} />
          )}
        </Group>

        <Group title="מעבר בין עמודי הקטלוג">
          {pagination.changes === 0 ? (
            <Quiet>עדיין לא עברו בין עמודי הקטלוג.</Quiet>
          ) : (
            <Sentence>{`עברו בין עמודי הקטלוג ${times(pagination.changes)}, ועד עמוד ${formatCount(pagination.deepestPage)} לכל היותר.`}</Sentence>
          )}
        </Group>

        <Group title="עד איפה גוללים" hint="איזה חלק מצפיות הדפים גלל לפחות עד הנקודה הזו. דפים קצרים שאין בהם מה לגלול לא נספרים.">
          {!hasScroll ? (
            <Quiet>עדיין אין נתוני גלילה.</Quiet>
          ) : (
            <BarRows
              total={kpis.pageViews}
              noun="צפיות"
              items={scroll.map((row) => ({ key: String(row.pct), label: `לפחות ${row.pct}% מהדף`, value: row.pageViews }))}
            />
          )}
        </Group>

        <Group title="כמה זמן נשארים בכל דף" hint="בדפים עם לפחות 3 מדידות. הארוכים ראשונים.">
          {engagement.timeOnPage.length === 0 ? (
            <Quiet>אין עדיין דף עם מספיק מדידות.</Quiet>
          ) : (
            <NameRows
              items={engagement.timeOnPage.map((row) => ({ key: row.path, label: pageLabel(safeDecode(row.path)), stat: `בממוצע ${durationWords(row.avgSeconds)}` }))}
            />
          )}
        </Group>

        <Group title="לחיצות חוזרות באותו מקום" hint="שלוש לחיצות ויותר ברצף. בדרך כלל זה אומר שמשהו נראה כמו כפתור ולא עובד.">
          {engagement.rageClicks.length === 0 ? (
            <Quiet>לא נרשמו לחיצות חוזרות.</Quiet>
          ) : (
            <NameRows items={engagement.rageClicks.map((row) => ({ key: row.target, label: clickLabel(row.target), stat: times(row.count) }))} />
          )}
        </Group>
      </Disclosure>
    </>
  );
}
