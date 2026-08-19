import { Box, Typography } from "@mui/material";
import type { PricedAmount } from "../api/types";
import { discountPercent, formatMoney } from "../utils/format";

export function Price({ prices, size = "md" }: { prices: PricedAmount | null; size?: "sm" | "md" | "lg" }) {
  if (!prices) return null;
  const sale = prices.salePrice.minor !== prices.regularPrice.minor && prices.price.minor === prices.salePrice.minor;
  const percent = sale ? discountPercent(prices.regularPrice.minor, prices.salePrice.minor) : null;
  const fontSize = size === "lg" ? 32 : size === "sm" ? 16 : 20;

  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25, flexWrap: "wrap" }}>
      <Typography sx={{ fontSize, fontWeight: 700, letterSpacing: "-0.03em" }}>
        {formatMoney(prices.price.major, prices.currencySuffix || " ₪")}
      </Typography>
      {sale ? (
        <Typography color="text.secondary" sx={{ textDecoration: "line-through", fontSize: size === "lg" ? 18 : 14 }}>
          {formatMoney(prices.regularPrice.major, prices.currencySuffix || " ₪")}
        </Typography>
      ) : null}
      {percent ? (
        <Typography color="secondary.main" sx={{ fontWeight: 700, fontSize: 13 }}>
          -{percent}%
        </Typography>
      ) : null}
    </Box>
  );
}
