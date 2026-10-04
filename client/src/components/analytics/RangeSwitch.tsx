import { Box } from "@mui/material";
import { RANGE_OPTIONS } from "../../analytics/labels";
import { focusRing, ink } from "./shared";

/** Four fixed ranges as quiet text options, kept in the URL by the page. */
export function RangeSwitch({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <Box role="group" aria-label="תקופה" sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {RANGE_OPTIONS.map((option) => {
        const selected = option.days === days;
        return (
          <Box
            key={option.days}
            component="button"
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.days)}
            sx={{
              minHeight: 44,
              minWidth: 44,
              px: 1.75,
              border: 0,
              borderRadius: 999,
              bgcolor: selected ? ink.track : "transparent",
              color: selected ? ink.text : ink.muted,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: selected ? 700 : 500,
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
