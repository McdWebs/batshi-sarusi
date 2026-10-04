import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { AnalyticsSummary } from "../../api/types";
import { formatCount, formatShortDay } from "../../analytics/labels";
import { chartInk, ink, tabular, visuallyHidden } from "./shared";

type Day = AnalyticsSummary["daily"][number];

const HEIGHT_PHONE = 220;
const HEIGHT_WIDE = 300;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 34 };
const MAX_BAR = 24;
const GAP = 2;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(240, Math.round(node.clientWidth)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/** An even top value so the middle tick is a whole number too. */
function niceMax(max: number): number {
  if (max <= 10) return Math.max(2, Math.ceil(max / 2) * 2);
  const unit = 10 ** (Math.floor(Math.log10(max)) - 1) * 2;
  return Math.ceil(max / unit) * unit;
}

function readout(day: Day) {
  if (day.sessions === 0) return `${formatShortDay(day.day)}: אין ביקורים`;
  return `${formatShortDay(day.day)}: ${formatCount(day.visitors)} מבקרים, ${formatCount(day.sessions)} כניסות`;
}

export function DailyChart({ daily, days }: { daily: Day[]; days: number }) {
  const { ref, width } = useWidth();
  const [active, setActive] = useState<number | null>(null);

  const totalVisits = daily.reduce((sum, day) => sum + day.sessions, 0);
  const peak = daily.reduce<Day | null>((best, day) => (day.sessions > (best?.sessions ?? 0) ? day : best), null);
  const hasTraffic = totalVisits > 0;
  const top = niceMax(Math.max(1, ...daily.map((day) => Math.max(day.visitors, day.sessions))));
  const innerW = width - MARGIN.left - MARGIN.right;
  const height = width >= 700 ? HEIGHT_WIDE : HEIGHT_PHONE;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const slot = innerW / Math.max(1, daily.length);
  const barW = Math.max(1, Math.min(MAX_BAR, slot - GAP));
  const y = (value: number) => MARGIN.top + innerH - (value / top) * innerH;
  const cx = (index: number) => MARGIN.left + slot * index + slot / 2;
  const labelEvery = Math.max(1, Math.ceil(daily.length / Math.max(2, Math.floor(innerW / 52))));
  const ticks = [0, top / 2, top];
  const line = daily.map((day, index) => `${index === 0 ? "M" : "L"}${cx(index).toFixed(1)} ${y(day.sessions).toFixed(1)}`).join(" ");
  const shown = active !== null ? daily[active] : null;

  const summary = hasTraffic
    ? `בסך הכול ${formatCount(totalVisits)} כניסות לאתר. היום העמוס ביותר: ${formatShortDay(peak?.day ?? "")}, עם ${formatCount(peak?.sessions ?? 0)} כניסות.`
    : "אין כניסות לאתר בטווח הזה.";

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", alignItems: "center", fontSize: 14, mb: 1 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Box aria-hidden="true" sx={{ width: 10, height: 10, bgcolor: chartInk.bar, borderRadius: "2px" }} />
          מבקרים
        </Box>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Box aria-hidden="true" sx={{ width: 16, height: 2, bgcolor: chartInk.second, borderRadius: 1 }} />
          כניסות
        </Box>
        <Typography aria-live="polite" sx={{ marginInlineStart: { sm: "auto" }, flexBasis: { xs: "100%", sm: "auto" }, fontSize: 14, fontWeight: 700, minHeight: 20, ...tabular }}>
          {shown ? readout(shown) : hasTraffic && peak ? `היום העמוס ביותר: ${readout(peak)}` : ""}
        </Typography>
      </Box>

      <Box ref={ref} sx={{ width: "100%", direction: "ltr" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`גרף עמודות של מבקרים וכניסות לפי יום. ${summary}`}
          style={{ display: "block", height: "auto", overflow: "visible" }}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="rgba(44,36,30,0.12)" strokeWidth={1} />
              <text x={MARGIN.left - 6} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="#6A6158" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCount(tick)}
              </text>
            </g>
          ))}

          {daily.map((day, index) => {
            const isActive = active === index;
            const barTop = y(day.visitors);
            const h = Math.max(0, MARGIN.top + innerH - barTop);
            const x = cx(index) - barW / 2;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={day.day}>
                {isActive ? <rect x={MARGIN.left + slot * index} y={MARGIN.top} width={slot} height={innerH} fill="rgba(44,36,30,0.06)" /> : null}
                {day.visitors > 0 ? (
                  // Rounded data end, square on the baseline.
                  <path
                    d={`M${x} ${MARGIN.top + innerH} V${barTop + r} Q${x} ${barTop} ${x + r} ${barTop} H${x + barW - r} Q${x + barW} ${barTop} ${x + barW} ${barTop + r} V${MARGIN.top + innerH} Z`}
                    fill={chartInk.bar}
                  />
                ) : (
                  <rect x={x} y={MARGIN.top + innerH - 2} width={barW} height={2} fill={chartInk.emptyDay} />
                )}
              </g>
            );
          })}

          {hasTraffic ? <path d={line} fill="none" stroke={chartInk.second} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /> : null}
          {hasTraffic && daily.length <= 31
            ? daily.map((day, index) => (day.sessions > 0 ? <circle key={day.day} cx={cx(index)} cy={y(day.sessions)} r={active === index ? 5 : 3.5} fill={chartInk.second} stroke="#FFFBF5" strokeWidth={2} /> : null))
            : null}

          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} stroke="rgba(44,36,30,0.32)" strokeWidth={1} />
          {daily.map((day, index) =>
            index % labelEvery === 0 ? (
              <text key={day.day} x={cx(index)} y={height - 8} textAnchor="middle" fontSize={12} fill="#6A6158" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatShortDay(day.day)}
              </text>
            ) : null,
          )}

          {/* Wide invisible columns: much easier to hit than a 3px bar. */}
          {daily.map((day, index) => (
            <rect
              key={`hit-${day.day}`}
              x={MARGIN.left + slot * index}
              y={MARGIN.top}
              width={slot}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => setActive(index)}
              onPointerDown={() => setActive(index)}
            />
          ))}
        </svg>
      </Box>

      {!hasTraffic ? (
        <Typography sx={{ mt: 1, fontSize: 14, color: "text.secondary" }}>אין כניסות בטווח הזה, ולכן אין מה להציג בגרף.</Typography>
      ) : null}
      <Typography sx={visuallyHidden}>{summary}</Typography>

      <Box component="details" sx={{ mt: 1, fontSize: 14 }}>
        <Typography component="summary" sx={{ cursor: "pointer", color: ink.accent, fontSize: 14, fontWeight: 600, width: "fit-content", minHeight: 44, display: "flex", alignItems: "center", "&:focus-visible": { outline: `2px solid ${ink.accent}`, outlineOffset: 2 } }}>
          הצגה כטבלה ({days === 1 ? "24 שעות אחרונות" : `${days} ימים`})
        </Typography>
        <Box sx={{ maxHeight: 260, overflow: "auto", mt: 1 }}>
          <Box component="table" sx={{ borderCollapse: "collapse", width: "100%", maxWidth: 420, fontSize: 14, ...tabular }}>
            <thead>
              <tr>
                {["יום", "מבקרים", "כניסות"].map((head) => (
                  <Box component="th" key={head} scope="col" sx={{ textAlign: "start", py: 0.5, paddingInlineEnd: 2, borderBottom: "1px solid", borderColor: "divider", position: "sticky", top: 0, bgcolor: "background.default" }}>
                    {head}
                  </Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {daily.map((day) => (
                <tr key={day.day}>
                  <Box component="td" sx={{ py: 0.4, borderBottom: "1px solid", borderColor: "divider" }}>{formatShortDay(day.day)}</Box>
                  <Box component="td" sx={{ py: 0.4, borderBottom: "1px solid", borderColor: "divider" }}>{formatCount(day.visitors)}</Box>
                  <Box component="td" sx={{ py: 0.4, borderBottom: "1px solid", borderColor: "divider" }}>{formatCount(day.sessions)}</Box>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
