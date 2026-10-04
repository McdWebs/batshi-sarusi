import { Box, Skeleton } from "@mui/material";
import { bone } from "./shared";

/** Placeholder shown on the very first load: a KPI row, the chart and a couple of lists. */
export function AnalyticsSkeleton() {
  return (
    <Box sx={{ display: "grid", gap: 3 }} aria-busy="true" aria-label="טוען">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 2 }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} variant="rectangular" animation="wave" height={96} sx={bone} />
        ))}
      </Box>
      <Skeleton variant="rectangular" animation="wave" height={220} sx={bone} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {Array.from({ length: 2 }, (_, column) => (
          <Box key={column} sx={{ display: "grid", gap: 1.5 }}>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} variant="rectangular" animation="wave" height={36} sx={bone} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
