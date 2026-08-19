import { Box, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Link } from "react-router-dom";
import type { CartItem } from "../api/types";
import { formatMoney, productPathFromPermalink } from "../utils/format";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

function QuantityStepper({
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (quantity: number) => void;
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "flex-start",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#FFFbf5",
        height: 28,
        width: "fit-content",
        flexShrink: 0,
      }}
    >
      <IconButton
        size="small"
        aria-label="הפחתה"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        sx={{ borderRadius: 0, width: 26, height: 26, p: 0 }}
      >
        <RemoveIcon sx={{ fontSize: 14 }} />
      </IconButton>
      <Typography
        component="span"
        sx={{ minWidth: 20, textAlign: "center", fontSize: 12, fontWeight: 600, lineHeight: 1 }}
      >
        {value}
      </Typography>
      <IconButton
        size="small"
        aria-label="הוספה"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        sx={{ borderRadius: 0, width: 26, height: 26, p: 0 }}
      >
        <AddIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}

export function CartLineItem({
  item,
  busy,
  onQuantity,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  busy?: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onNavigate?: () => void;
}) {
  const image = item.images[0];
  const href = productPathFromPermalink(item.permalink);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: 1.5,
        bgcolor: "#FFFbf5",
        border: "1px solid",
        borderColor: "divider",
        alignItems: "flex-start",
      }}
    >
      <Box
        component={Link}
        to={href}
        onClick={onNavigate}
        sx={{
          width: 88,
          height: 88,
          flexShrink: 0,
          overflow: "hidden",
          bgcolor: "#EDE4D6",
          display: "block",
        }}
      >
        {image ? (
          <StoreImage
            src={image.thumbnail || image.src}
            alt={image.alt || item.name}
            sx={{ width: 88, height: 88 }}
          />
        ) : null}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
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
              fontSize: 14,
              lineHeight: 1.35,
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
            sx={{ mt: -0.5, me: -0.5, color: "text.secondary" }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        {item.variation.map((entry) => (
          <Typography key={entry.attribute} variant="caption" color="text.secondary" display="block">
            {entry.attribute}: {entry.value}
          </Typography>
        ))}
        {item.prices ? (
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
            <Price prices={item.prices} size="sm" />
            {item.quantity > 1 ? (
              <Typography variant="caption" color="text.secondary">
                סה״כ {formatMoney(item.totals.totalPrice.major)}
              </Typography>
            ) : null}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em" }}>
            {formatMoney(item.totals.totalPrice.major)}
          </Typography>
        )}
        <QuantityStepper
          value={item.quantity}
          min={item.quantityLimits.minimum}
          max={item.quantityLimits.maximum}
          disabled={busy || !item.quantityLimits.editable}
          onChange={onQuantity}
        />
      </Box>
    </Box>
  );
}
