import { Box, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;
  return (
    <Box
      component="nav"
      aria-label="מיקום באתר"
      sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center", mb: 2, fontSize: 14, color: "text.secondary" }}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Box key={`${item.label}-${index}`} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {index ? <span aria-hidden="true">/</span> : null}
            {item.to ? (
              <MuiLink component={Link} to={item.to} underline="hover" color="inherit">
                {item.label}
              </MuiLink>
            ) : (
              <Box component="span" sx={{ color: last ? "text.primary" : "inherit", fontWeight: last ? 600 : 400 }}>
                {item.label}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
