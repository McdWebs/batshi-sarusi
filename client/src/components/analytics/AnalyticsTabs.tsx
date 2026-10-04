import { Box } from "@mui/material";
import { useRef, type KeyboardEvent } from "react";
import { TAB_OPTIONS, type AnalyticsTabId } from "../../analytics/labels";
import { focusRing, ink } from "./shared";

export const tabButtonId = (id: AnalyticsTabId) => `analytics-tab-${id}`;
export const tabPanelId = (id: AnalyticsTabId) => `analytics-panel-${id}`;

/**
 * Five quiet underlined tabs in one scrollable row. Arrow keys, Home and End move between them (the arrows follow the
 * reading direction), and only the chosen tab is in the tab order.
 */
export function AnalyticsTabs({ tab, onChange, label }: { tab: AnalyticsTabId; onChange: (tab: AnalyticsTabId) => void; label: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TAB_OPTIONS.findIndex((option) => option.id === tab);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const last = TAB_OPTIONS.length - 1;
    let next = index;
    if (event.key === "ArrowRight") next = rtl ? index - 1 : index + 1;
    else if (event.key === "ArrowLeft") next = rtl ? index + 1 : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    next = (next + last + 1) % (last + 1);
    const target = TAB_OPTIONS[next];
    if (!target) return;
    onChange(target.id);
    refs.current[next]?.focus();
  };

  return (
    <Box
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      sx={{ display: "flex", gap: { xs: 2.5, sm: 3.5 }, overflowX: "auto", borderBottom: `1px solid ${ink.rule}`, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
    >
      {TAB_OPTIONS.map((option, index) => {
        const selected = option.id === tab;
        return (
          <Box
            key={option.id}
            ref={(node: HTMLButtonElement | null) => {
              refs.current[index] = node;
            }}
            component="button"
            type="button"
            role="tab"
            id={tabButtonId(option.id)}
            aria-selected={selected}
            aria-controls={tabPanelId(option.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.id)}
            sx={{
              flex: "0 0 auto",
              minHeight: 48,
              px: 0,
              border: 0,
              borderBottom: `2px solid ${selected ? ink.accent : "transparent"}`,
              marginBottom: "-1px",
              bgcolor: "transparent",
              color: selected ? ink.text : ink.muted,
              fontFamily: "inherit",
              fontSize: 16,
              fontWeight: selected ? 700 : 500,
              whiteSpace: "nowrap",
              cursor: "pointer",
              "&:hover": { color: ink.text },
              ...focusRing,
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}
