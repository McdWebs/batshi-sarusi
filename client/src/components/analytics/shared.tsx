import { Box, Button, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { downloadCsv, formatCount, formatPercent } from "../../analytics/labels";
import { isLatinText } from "./insights";

/**
 * The look of the owner dashboard. One accent (terracotta) for bars and links, status colours only for a status word
 * and its dot, hairlines instead of boxes. Type scale: 12 / 14 / 16 / 22 / 26 / 40.
 */
export const ink = {
  text: "#1C1814",
  muted: "#6A6158",
  accent: "#8F3D2A",
  track: "#EDE4D6",
  rule: "rgba(44,36,30,0.14)",
  paper: "#FFFbf5",
  good: "#2E6B4F",
  problem: "#8F3D2A",
  /** Readable amber for text; the lighter gold is for the dot only. */
  attention: "#8A5A00",
  attentionDot: "#B07D2B",
} as const;

/** Colours the daily chart draws with. */
export const chartInk = {
  bar: ink.accent,
  second: "#B07D2B",
  track: ink.track,
  emptyDay: "#D6CBBA",
  good: ink.good,
  worse: ink.problem,
} as const;

export const bone = { bgcolor: ink.track, transform: "none" } as const;

export const tabular = { fontVariantNumeric: "tabular-nums" } as const;

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

/**
 * How the detail blocks are laid out: one column on a phone, two side by side from the "md" breakpoint (900px).
 * Blocks that need the full width (a closed disclosure, a note) span both columns.
 */
export const detailGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
  columnGap: { md: 8 },
  rowGap: 5,
  alignItems: "start",
} as const;

export const spanAll = { gridColumn: "1 / -1" } as const;

export const focusRing = { "&:focus-visible": { outline: `2px solid ${ink.accent}`, outlineOffset: 2 } } as const;

export const serif = '"Noto Serif Hebrew", "Times New Roman", serif';

export type Tone = "problem" | "attention" | "good" | "info";

export const TONES: Record<Tone, { word: string; dot: string; text: string }> = {
  problem: { word: "דורש טיפול", dot: ink.problem, text: ink.problem },
  attention: { word: "שווה בדיקה", dot: ink.attentionDot, text: ink.attention },
  good: { word: "חדשות טובות", dot: ink.good, text: ink.good },
  info: { word: "לידיעה", dot: ink.muted, text: ink.muted },
};

/** A colour dot followed by a written status. The word is always shown, so colour is never the only signal. */
export function StatusWord({ tone, word }: { tone: Tone; word?: string }) {
  const style = TONES[tone];
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, color: style.text, fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
      <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: style.dot, flexShrink: 0 }} />
      {word ?? style.word}
    </Box>
  );
}

/** A block of the page: an h2 and its content, 48px from the next block. */
export function Block({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  const generated = useId();
  const headingId = id ?? generated;
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ mt: 6 }}>
      <Typography id={headingId} variant="h2" sx={{ fontSize: { xs: 22, md: 26 }, lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}

/** An h3 inside a tab, with an optional one-line hint and an action (the CSV button) at the end of the row. */
export function Group({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box component="div" sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minHeight: 32 }}>
        <Typography variant="h3" component="h3" sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {hint ? <Typography sx={{ mt: 0.25, color: ink.muted, fontSize: 14, lineHeight: 1.5 }}>{hint}</Typography> : null}
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}

/** One short grey sentence for a list with nothing in it. */
export function Quiet({ children }: { children: ReactNode }) {
  return <Typography sx={{ py: 0.5, color: ink.muted, fontSize: 14, lineHeight: 1.6 }}>{children}</Typography>;
}

/** A plain sentence in body type, for the one-line answers inside the tabs. */
export function Sentence({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontSize: 16, lineHeight: 1.6 }}>{children}</Typography>;
}

/** A closed-by-default disclosure for the details only an expert wants. */
export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <Box
      component="details"
      sx={{
        ...spanAll,
        borderTop: `1px solid ${ink.rule}`,
        borderBottom: `1px solid ${ink.rule}`,
        "& > summary::-webkit-details-marker": { display: "none" },
        "&[open] > summary .chevron": { transform: "rotate(180deg)" },
      }}
    >
      <Box
        component="summary"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 48,
          cursor: "pointer",
          listStyle: "none",
          color: ink.accent,
          fontSize: 14,
          fontWeight: 700,
          ...focusRing,
        }}
      >
        {summary}
        <Box component="span" className="chevron" aria-hidden="true" sx={{ fontSize: 12, transition: "transform 160ms", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
          ▼
        </Box>
      </Box>
      <Box sx={{ pb: 3, pt: 2, ...detailGrid }}>{children}</Box>
    </Box>
  );
}

const rowSx = { py: 1.5, borderTop: `1px solid ${ink.rule}` } as const;

/**
 * A list that shows at most `limit` rows and a "show more" text button for the rest. The page only ever hands it
 * rows that are already capped by the server, so "more" never means "hundreds".
 */
export function ShowMore<T>({ items, render, getKey, limit = 5 }: { items: T[]; render: (item: T) => ReactNode; getKey: (item: T) => string; limit?: number }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, limit);
  const listId = useId();
  return (
    <>
      <Box id={listId} component="ul" sx={{ listStyle: "none", m: 0, p: 0, borderBottom: `1px solid ${ink.rule}` }}>
        {shown.map((item) => (
          <Box component="li" key={getKey(item)} sx={rowSx}>
            {render(item)}
          </Box>
        ))}
      </Box>
      {items.length > limit ? (
        <Button
          variant="text"
          color="secondary"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          sx={{ mt: 0.5, minHeight: 44, px: 1, fontSize: 14, fontWeight: 700, ...focusRing }}
        >
          {open ? "הצג פחות" : "הצג עוד"}
          {open ? null : <Box component="span" sx={visuallyHidden}> ({items.length - limit} נוספים)</Box>}
        </Button>
      ) : null}
    </>
  );
}

/** Text that may be a URL or file name: left to right when it has no Hebrew, so it does not get scrambled. */
export function Bidi({ text }: { text: string }) {
  if (isLatinText(text)) {
    return (
      <Box component="span" dir="ltr" sx={{ display: "inline-block", maxWidth: "100%", overflowWrap: "anywhere" }}>
        {text}
      </Box>
    );
  }
  return <>{text}</>;
}

const linkSx = {
  color: "inherit",
  textDecoration: "underline",
  textDecorationColor: ink.rule,
  textUnderlineOffset: "4px",
  "&:hover": { textDecorationColor: ink.accent, color: ink.accent },
  ...focusRing,
} as const;

export function NameLabel({ label, href }: { label: string; href?: string }) {
  const content = <Bidi text={label} />;
  return href ? (
    <Typography component={RouterLink} to={href} sx={{ fontSize: 16, lineHeight: 1.4, overflowWrap: "anywhere", ...linkSx }}>
      {content}
    </Typography>
  ) : (
    <Typography component="span" sx={{ fontSize: 16, lineHeight: 1.4, overflowWrap: "anywhere" }}>
      {content}
    </Typography>
  );
}

export type NameRowItem = { key: string; label: string; href?: string; /** What the row counts, written in words: "45 צפיות · 12 הוספות". */ stat?: ReactNode; prefix?: ReactNode };

/** A name and, beside it (or under it on a narrow screen), its numbers written with the thing they count. */
export function NameRows({ items }: { items: NameRowItem[] }) {
  return (
    <ShowMore
      items={items}
      getKey={(item) => item.key}
      render={(item) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: 2, rowGap: 0.25 }}>
          <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
            {item.prefix}
            <NameLabel label={item.label} href={item.href} />
          </Box>
          {item.stat ? <Typography component="div" sx={{ flex: "0 0 auto", color: ink.muted, fontSize: 14, ...tabular }}>{item.stat}</Typography> : null}
        </Box>
      )}
    />
  );
}

export type BarItem = { key: string; label: string; value: number; href?: string; /** Replaces the default "34% · 120 כניסות". */ valueText?: ReactNode };

/**
 * Thin bars. The bar is the value's share of `total` (honest, never stretched), and the share and the count are always
 * written next to it, with the thing they count.
 */
export function BarRows({ items, total, noun }: { items: BarItem[]; total: number; noun: string }) {
  return (
    <ShowMore
      items={items}
      getKey={(item) => item.key}
      render={(item) => {
        const share = total > 0 ? Math.min(1, item.value / total) : 0;
        return (
          <>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <NameLabel label={item.label} href={item.href} />
              </Box>
              <Typography component="div" sx={{ flexShrink: 0, color: ink.muted, fontSize: 14, whiteSpace: "nowrap", ...tabular }}>
                {item.valueText ?? (
                  <>
                    <Box component="span" sx={{ color: ink.text, fontWeight: 700 }}>{formatPercent(share)}</Box> · {formatCount(item.value)} {noun}
                  </>
                )}
              </Typography>
            </Box>
            <Box aria-hidden="true" sx={{ mt: 1, height: 6, bgcolor: ink.track, borderRadius: 3, overflow: "hidden" }}>
              <Box sx={{ height: "100%", width: `${item.value > 0 ? Math.max(1, share * 100) : 0}%`, bgcolor: ink.accent, borderRadius: 3 }} />
            </Box>
          </>
        );
      }}
    />
  );
}

/** A small "CSV" text button that downloads the rows of the list it sits on (UTF-8 with BOM for Excel). */
export function CsvButton({ filename, headers, rows }: { filename: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <Button
      size="small"
      variant="text"
      color="secondary"
      disabled={rows.length === 0}
      aria-label="הורדת הרשימה כקובץ CSV"
      onClick={() => downloadCsv(filename, headers, rows)}
      sx={{ minHeight: 32, minWidth: 0, px: 1, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", ...focusRing }}
    >
      CSV
    </Button>
  );
}
