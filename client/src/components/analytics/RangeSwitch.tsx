import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { RANGE_OPTIONS } from "../../analytics/labels";

/** Four fixed ranges, kept in the URL by the page. */
export function RangeSwitch({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      color="primary"
      value={days}
      onChange={(_, next: number | null) => {
        if (next !== null) onChange(next);
      }}
      aria-label="טווח זמן"
      sx={{ width: { xs: "100%", sm: "auto" } }}
    >
      {RANGE_OPTIONS.map((option) => (
        <ToggleButton key={option.days} value={option.days} sx={{ flex: { xs: 1, sm: "none" }, px: { xs: 1, sm: 2.5 }, py: 0.75, fontSize: 14, fontWeight: 600, minHeight: 40 }}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
