import { Box, Skeleton } from "@mui/material";
import { bone, ink } from "./shared";

/** Placeholder for the first load, shaped like the page: the summary block, three numbers and a few rows. */
export function AnalyticsSkeleton() {
  return (
    <Box aria-busy="true" aria-label="טוען" role="status" sx={{ mt: 6 }}>
      <Box sx={{ bgcolor: ink.paper, border: `1px solid ${ink.rule}`, p: { xs: 2.5, md: 4 } }}>
        <Skeleton variant="rectangular" animation="wave" height={26} sx={{ ...bone, mb: 1 }} />
        <Skeleton variant="rectangular" animation="wave" height={26} width="70%" sx={bone} />
        <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 2 }}>
          {Array.from({ length: 3 }, (_, index) => (
            <Box key={index}>
              <Skeleton variant="rectangular" animation="wave" height={14} width="60%" sx={{ ...bone, mb: 1 }} />
              <Skeleton variant="rectangular" animation="wave" height={40} sx={bone} />
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ mt: 6, display: "grid", gap: 1.5 }}>
        <Skeleton variant="rectangular" animation="wave" height={26} width="45%" sx={bone} />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rectangular" animation="wave" height={52} sx={bone} />
        ))}
      </Box>
    </Box>
  );
}
