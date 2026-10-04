import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Box, Button, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { downloadCsv, formatCount, formatPercent } from "../../analytics/labels";

/** One calm chart system: a single terracotta for the main series, a validated gold for the second one. */
export const chartInk = {
  bar: "#8F3D2A",
  second: "#B07D2B",
  track: "#E7DFD2",
  emptyDay: "#D6CBBA",
  good: "#2E6B4F",
  worse: "#8F3D2A",
} as const;

export const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

export const visuallyHidden: SxProps<Theme> = {
  position: "absolute",
  width: "1px",
  height: "1px",
  p: 0,
  m: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export const tabular = { fontVariantNumeric: "tabular-nums" } as const;

/** A titled block separated from the next by a hairline rule. Headings run h1 (page), h2 (this), h3 (SubSection). */
export function Section({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <Box component="section" aria-labelledby={id} sx={{ borderTop: "1px solid", borderColor: "divider", pt: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
      <Typography id={id} variant="h3" component="h2" sx={{ fontSize: { xs: 21, md: 24 }, lineHeight: 1.25 }}>
        {title}
      </Typography>
      {intro ? (
        <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: 14, maxWidth: 620 }}>{intro}</Typography>
      ) : null}
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Box>
  );
}

export function SubSection({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h3" component="h3" sx={{ fontSize: 16, fontFamily: '"Heebo", sans-serif', fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {hint ? <Typography sx={{ mt: 0.25, mb: 1, color: "text.secondary", fontSize: 13, maxWidth: 520 }}>{hint}</Typography> : <Box sx={{ mb: 1 }} />}
      {children}
    </Box>
  );
}

export function TwoColumns({ children }: { children: ReactNode }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, columnGap: 6, rowGap: 4 }}>{children}</Box>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <Typography sx={{ py: 1.5, color: "text.secondary", fontSize: 14, borderTop: "1px solid", borderColor: "divider" }}>{children}</Typography>
  );
}

export function CsvButton({ filename, headers, rows, disabled }: { filename: string; headers: string[]; rows: Array<Array<string | number>>; disabled?: boolean }) {
  return (
    <Button
      size="small"
      variant="text"
      color="secondary"
      disabled={disabled || rows.length === 0}
      startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
      onClick={() => downloadCsv(filename, headers, rows)}
      sx={{ py: 0.25, px: 1, fontSize: 13, minHeight: 32 }}
    >
      הורדת CSV
    </Button>
  );
}

export type BarItem = { key: string; label: string; value: number; href?: string; note?: string };

/**
 * Horizontal bars. The bar is the value's share of `total` (so it is honest, never stretched to fill),
 * and the count and percent are always written out, so colour and length are never the only signal.
 */
export function BarList({ items, total, valueNoun }: { items: BarItem[]; total: number; valueNoun?: string }) {
  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {items.map((item) => {
        const share = total > 0 ? Math.min(1, item.value / total) : 0;
        return (
          <Box component="li" key={item.key} sx={{ py: 1, borderTop: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: "1px solid", borderColor: "divider" } }}>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                {item.href ? (
                  <Typography component={RouterLink} to={item.href} sx={{ color: "inherit", fontSize: 15, lineHeight: 1.35, overflowWrap: "anywhere", unicodeBidi: "plaintext", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                    {item.label}
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: 15, lineHeight: 1.35, overflowWrap: "anywhere" }}>{item.label}</Typography>
                )}
                {item.note ? <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.note}</Typography> : null}
              </Box>
              <Typography sx={{ flexShrink: 0, fontSize: 14, whiteSpace: "nowrap", ...tabular }}>
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {formatCount(item.value)}
                </Box>
                {valueNoun ? <Box component="span" sx={{ color: "text.secondary" }}> {valueNoun}</Box> : null}
                <Box component="span" sx={{ color: "text.secondary" }}> · {formatPercent(share)}</Box>
              </Typography>
            </Box>
            <Box sx={{ mt: 0.75, height: 8, bgcolor: chartInk.track }} aria-hidden="true">
              <Box
                sx={{
                  height: "100%",
                  width: `${item.value > 0 ? Math.max(1, share * 100) : 0}%`,
                  bgcolor: chartInk.bar,
                  borderStartEndRadius: 4,
                  borderEndEndRadius: 4,
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** A ranked list row set: rank, linked name and a few right-aligned numbers. */
export function RankedRows({ rows }: { rows: Array<{ key: string; label: string; href?: string; stats: Array<{ value: string; caption: string }> }> }) {
  return (
    <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, borderBottom: "1px solid", borderColor: "divider" }}>
      {rows.map((row, index) => (
        <Box
          component="li"
          key={row.key}
          sx={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr) auto", alignItems: "center", gap: 1.25, py: 1.1, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", ...tabular }}>{index + 1}</Typography>
          {row.href ? (
            <Typography component={RouterLink} to={row.href} sx={{ color: "inherit", fontSize: 15, lineHeight: 1.35, overflowWrap: "anywhere", unicodeBidi: "plaintext", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              {row.label}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 15, lineHeight: 1.35, overflowWrap: "anywhere", unicodeBidi: "plaintext" }}>{row.label}</Typography>
          )}
          <Box sx={{ display: "flex", gap: 2, textAlign: "end" }}>
            {row.stats.map((stat) => (
              <Box key={stat.caption} sx={{ minWidth: 44 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1, ...tabular }}>{stat.value}</Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{stat.caption}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
