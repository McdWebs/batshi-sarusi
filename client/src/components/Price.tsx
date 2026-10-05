import { Box, Typography } from "@mui/material";
import type { PricedAmount } from "../api/types";
import { discountPercent, formatMoney } from "../utils/format";

export function Price({ prices, size = "md" }: { prices: PricedAmount | null; size?: "sm" | "md" | "lg" }) {
  if (!prices) return null;
  const sale = prices.salePrice.minor !== prices.regularPrice.minor && prices.price.minor === prices.salePrice.minor;
  const percent = sale ? discountPercent(prices.regularPrice.minor, prices.salePrice.minor) : null;
  const fontSize = size === "lg" ? 32 : size === "sm" ? 16 : 20;
  const suffix = prices.currencySuffix || " ₪";

  // No price is set in the shop for this product (the old site printed "0.00 ₪"), so say so instead of showing a zero.
  if (Number(prices.price.minor) <= 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: size === "lg" ? 20 : 14, fontWeight: 600 }}>
        המחיר לפי פנייה
      </Typography>
    );
  }
  const range = prices.priceRange && prices.priceRange.minAmount.minor !== prices.priceRange.maxAmount.minor ? prices.priceRange : null;

  // A product whose options cost different amounts shows the span, like the old site, not one price and a discount.
  if (range) {
    return (
      <Typography sx={{ fontSize, fontWeight: 700, letterSpacing: "-0.03em" }}>
        {formatMoney(range.minAmount.major, suffix)} – {formatMoney(range.maxAmount.major, suffix)}
      </Typography>
    );
  }

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
