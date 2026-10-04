import { Box } from "@mui/material";
import { times } from "../../analytics/advice";
import { deviceLabel, errorKindLabel, pageLabel, secondsText } from "../../analytics/labels";
import type { AnalyticsSummary } from "../../api/types";
import { lcpRating, safeDecode, shortImagePath, type LcpRating } from "./insights";
import { Disclosure, Group, ink, NameRows, Quiet, Sentence, StatusWord, type Tone } from "./shared";

const RATING: Record<LcpRating, { tone: Tone; sentence: string; word: string }> = {
  good: { tone: "good", sentence: "האתר נטען מהר", word: "מהיר" },
  needs: { tone: "attention", sentence: "האתר נטען בקצב בינוני", word: "בינוני" },
  poor: { tone: "problem", sentence: "האתר נטען לאט", word: "איטי" },
};

function Rated({ ms }: { ms: number }) {
  const rating = RATING[lcpRating(ms)];
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
      <span>{secondsText(ms)}</span>
      <StatusWord tone={rating.tone} word={rating.word} />
    </Box>
  );
}

export function HealthTab({ summary }: { summary: AnalyticsSummary }) {
  const { speed, problems } = summary;
  const rating = RATING[lcpRating(speed.lcpP75Ms)];
  const clean = problems.errors.length === 0 && problems.notFound.length === 0;

  return (
    <>
      <Group title="מהירות האתר" hint="הזמן שעובר עד שהתוכן הראשי מופיע על המסך, אצל מבקרים אמיתיים.">
        {speed.samples === 0 ? (
          <Quiet>אין עדיין מדידות מהירות. המהירות נמדדת רק בביקורים אמיתיים.</Quiet>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Sentence>{`${rating.sentence}: ב-75% מהטעינות התוכן הופיע תוך ${secondsText(speed.lcpP75Ms)}`}</Sentence>
            </Box>
            {speed.byDevice.length > 0 ? (
              <NameRows items={speed.byDevice.map((row) => ({ key: row.device, label: deviceLabel(row.device), stat: <Rated ms={row.medianMs} /> }))} />
            ) : null}
          </>
        )}
      </Group>

      <Group title="תקלות" hint="שרת הוא קריאה שנכשלה, תמונה היא תמונה שלא נטענה, ושגיאת דפדפן היא תקלה בקוד של האתר.">
        {clean ? (
          <Box component="p" sx={{ m: 0, py: 0.5, color: ink.good, fontSize: 16, fontWeight: 700 }}>
            לא נרשמו תקלות בתקופה הזו
          </Box>
        ) : problems.errors.length === 0 ? (
          <Quiet>לא נרשמו שגיאות.</Quiet>
        ) : (
          <NameRows
            items={problems.errors.map((row) => ({
              key: `${row.kind}:${row.where}`,
              prefix: (
                <Box component="span" sx={{ marginInlineEnd: 1, color: ink.muted, fontSize: 14, fontWeight: 700 }}>
                  {errorKindLabel(row.kind)}
                </Box>
              ),
              label: row.kind === "image" ? shortImagePath(row.where) : row.where || "-",
              stat: times(row.count),
            }))}
          />
        )}
      </Group>

      {!clean ? (
        <Group title="דפים שלא נמצאו" hint="מבקרים שהגיעו לכתובת שאינה קיימת. כדאי להפנות אותם לדף שקיים.">
          {problems.notFound.length === 0 ? (
            <Quiet>לא נרשמו דפים שלא נמצאו.</Quiet>
          ) : (
            <NameRows items={problems.notFound.map((row) => ({ key: row.path, label: safeDecode(row.path), stat: times(row.count) }))} />
          )}
        </Group>
      ) : null}

      {speed.samples > 0 ? (
        <Disclosure summary="הדפים האיטיים ביותר">
          <Group title="הדפים שנטענים הכי לאט" hint="דפים עם לפחות 3 מדידות. הזמן הוא זה ש-75% מהטעינות של הדף היו מהירות ממנו.">
            {speed.slowestPages.length === 0 ? (
              <Quiet>אין עדיין דף עם מספיק מדידות.</Quiet>
            ) : (
              <NameRows items={speed.slowestPages.map((row) => ({ key: row.path, label: pageLabel(safeDecode(row.path)), stat: <Rated ms={row.p75Ms} /> }))} />
            )}
          </Group>
        </Disclosure>
      ) : null}
    </>
  );
}
