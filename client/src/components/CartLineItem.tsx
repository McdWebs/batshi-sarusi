import { Box, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Link } from "react-router-dom";
import type { CartItem } from "../api/types";
import { discountPercent, formatMoney, productPathFromPermalink } from "../utils/format";
import { StoreImage } from "./StoreImage";

function QuantityStepper({
  value,
  min,
  max,
  disabled,
  compact,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  compact?: boolean;
  onChange: (quantity: number) => void;
}) {
  const size = compact ? 24 : 28;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: 1,
        height: size + 4,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <IconButton
        size="small"
        aria-label="הפחתה"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        sx={{
          borderRadius: 0,
          width: size + 4,
          height: size + 4,
          p: 0,
          color: "text.secondary",
          "&:hover": { bgcolor: "rgba(44, 36, 30, 0.04)" },
        }}
      >
        <RemoveIcon sx={{ fontSize: compact ? 13 : 15 }} />
      </IconButton>
      <Typography
        component="span"
        sx={{
          minWidth: compact ? 22 : 26,
          textAlign: "center",
          fontSize: compact ? 12 : 13,
          fontWeight: 600,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        aria-label="הוספה"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        sx={{
          borderRadius: 0,
          width: size + 4,
          height: size + 4,
          p: 0,
          color: "text.secondary",
          "&:hover": { bgcolor: "rgba(44, 36, 30, 0.04)" },
        }}
      >
        <AddIcon sx={{ fontSize: compact ? 13 : 15 }} />
      </IconButton>
    </Box>
  );
}

function CartLinePrice({
  item,
  compact,
}: {
  item: CartItem;
  compact?: boolean;
}) {
  const prices = item.prices;
  const lineTotal = formatMoney(item.totals.totalPrice.major);
  const showLineTotal = item.quantity > 1;

  if (!prices) {
    return (
      <Typography sx={{ fontSize: compact ? 15 : 16, fontWeight: 700, letterSpacing: "-0.03em" }}>
        {lineTotal}
      </Typography>
    );
  }

  const onSale =
    prices.salePrice.minor !== prices.regularPrice.minor && prices.price.minor === prices.salePrice.minor;
  const percent = onSale ? discountPercent(prices.regularPrice.minor, prices.salePrice.minor) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
        <Typography
          sx={{
            fontSize: compact ? 15 : 16,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}
        >
          {formatMoney(prices.price.major, prices.currencySuffix || " ₪")}
        </Typography>
        {onSale ? (
          <Typography
            color="text.secondary"
            sx={{
              textDecoration: "line-through",
              fontSize: compact ? 12 : 13,
              lineHeight: 1.2,
            }}
          >
            {formatMoney(prices.regularPrice.major, prices.currencySuffix || " ₪")}
          </Typography>
        ) : null}
        {percent ? (
          <Typography
            color="secondary.main"
            sx={{
              fontWeight: 700,
              fontSize: compact ? 11 : 12,
              lineHeight: 1.2,
              bgcolor: "rgba(143, 61, 42, 0.08)",
              px: 0.75,
              py: 0.125,
              borderRadius: 0.5,
            }}
          >
            -{percent}%
          </Typography>
        ) : null}
      </Box>
      {showLineTotal ? (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: compact ? 11 : 12 }}>
          סה״כ {lineTotal}
        </Typography>
      ) : null}
    </Box>
  );
}

export function CartLineItem({
  item,
  busy,
  compact = false,
  onQuantity,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  busy?: boolean;
  compact?: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onNavigate?: () => void;
}) {
  const image = item.images[0];
  const href = productPathFromPermalink(item.permalink);
  const imageSize = compact ? 76 : 96;

  return (
    <Box
      sx={{
        display: "flex",
        gap: compact ? 1.25 : 1.75,
        p: compact ? 1.25 : 1.75,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        boxShadow: "0 1px 2px rgba(28, 24, 20, 0.04)",
        alignItems: "stretch",
        opacity: busy ? 0.65 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      <Box
        component={Link}
        to={href}
        onClick={onNavigate}
        sx={{
          width: imageSize,
          height: imageSize,
          flexShrink: 0,
          overflow: "hidden",
          bgcolor: "#EDE4D6",
          borderRadius: 1,
          display: "block",
          alignSelf: "flex-start",
        }}
      >
        {image ? (
          <StoreImage
            src={image.thumbnail || image.src}
            alt={image.alt || item.name}
            sx={{ width: imageSize, height: imageSize, objectFit: "cover" }}
          />
        ) : null}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: compact ? 0.75 : 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
          <Typography
            component={Link}
            to={href}
            onClick={onNavigate}
            sx={{
              flex: 1,
              minWidth: 0,
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: compact ? 13 : 14,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              "&:hover": { color: "secondary.main" },
            }}
          >
            {item.name}
          </Typography>
          <IconButton
            size="small"
            aria-label="הסרה"
            onClick={onRemove}
            disabled={busy}
            sx={{
              mt: -0.25,
              ms: -0.25,
              width: 28,
              height: 28,
              flexShrink: 0,
              color: "text.secondary",
              "&:hover": { color: "secondary.main", bgcolor: "rgba(143, 61, 42, 0.06)" },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>

        {item.variation.length > 0 ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {item.variation.map((entry) => (
              <Typography
                key={entry.attribute}
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: compact ? 11 : 12,
                  bgcolor: "rgba(44, 36, 30, 0.04)",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  lineHeight: 1.3,
                }}
              >
                {entry.attribute}: {entry.value}
              </Typography>
            ))}
          </Box>
        ) : null}

        <Box
          sx={{
            mt: "auto",
            pt: compact ? 0.25 : 0.5,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <CartLinePrice item={item} compact={compact} />
          <QuantityStepper
            value={item.quantity}
            min={item.quantityLimits.minimum}
            max={item.quantityLimits.maximum}
            disabled={busy || !item.quantityLimits.editable}
            compact={compact}
            onChange={onQuantity}
          />
        </Box>
      </Box>
    </Box>
  );
}
