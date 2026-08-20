import { Box, IconButton, Skeleton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Link } from "react-router-dom";
import type { CartItem } from "../api/types";
import {
  discountPercent,
  formatMoney,
  productPathFromPermalink,
} from "../utils/format";
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
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        borderRadius: 1,
        height: 36,
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
          width: 36,
          height: 36,
          p: 0,
          color: "text.secondary",
          "&:hover": { bgcolor: "rgba(44, 36, 30, 0.04)" },
        }}
      >
        <RemoveIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <Typography
        component="span"
        sx={{
          minWidth: 28,
          textAlign: "center",
          fontSize: 14,
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
          width: 36,
          height: 36,
          p: 0,
          color: "text.secondary",
          "&:hover": { bgcolor: "rgba(44, 36, 30, 0.04)" },
        }}
      >
        <AddIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

function CartLinePrice({ item }: { item: CartItem }) {
  const prices = item.prices;

  if (!prices) {
    return (
      <Typography
        sx={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {formatMoney(item.totals.totalPrice.major)}
      </Typography>
    );
  }

  const onSale =
    prices.salePrice.minor !== prices.regularPrice.minor &&
    prices.price.minor === prices.salePrice.minor;
  const percent = onSale
    ? discountPercent(prices.regularPrice.minor, prices.salePrice.minor)
    : null;
  const suffix = prices.currencySuffix || " ₪";

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
      >
        <Typography
          sx={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {formatMoney(prices.price.major, suffix)}
        </Typography>
        {onSale ? (
          <Typography
            color="text.secondary"
            sx={{
              textDecoration: "line-through",
              fontSize: 13,
              lineHeight: 1.2,
            }}
          >
            {formatMoney(prices.regularPrice.major, suffix)}
          </Typography>
        ) : null}
        {percent ? (
          <Typography
            color="secondary.main"
            sx={{
              fontWeight: 700,
              fontSize: 12,
              lineHeight: 1,
              bgcolor: "rgba(143, 61, 42, 0.1)",
              px: 0.85,
              py: 0.4,
              borderRadius: 1,
            }}
          >
            -{percent}%
          </Typography>
        ) : null}
      </Box>
      {item.quantity > 1 ? (
        <Typography
          color="text.secondary"
          sx={{ fontSize: 12, lineHeight: 1.3 }}
        >
          מחיר ליחידה
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
  const imageSize = compact ? 88 : 112;
  const lineTotal = formatMoney(item.totals.totalPrice.major);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 1.25 : 1.5,
        p: compact ? 1.5 : 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: "0 1px 2px rgba(28, 24, 20, 0.04)",
        opacity: busy ? 0.65 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: compact ? 1.5 : 2,
          alignItems: "flex-start",
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
            borderRadius: 1.5,
            display: "block",
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

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
            <Typography
              component={Link}
              to={href}
              onClick={onNavigate}
              sx={{
                flex: 1,
                minWidth: 0,
                color: "inherit",
                textDecoration: "none",
                fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: compact ? 15 : 16,
                lineHeight: 1.45,
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
                mt: -0.5,
                me: -0.5,
                width: 32,
                height: 32,
                flexShrink: 0,
                color: "text.secondary",
                "&:hover": {
                  color: "secondary.main",
                  bgcolor: "rgba(143, 61, 42, 0.06)",
                },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
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
                    fontSize: 12,
                    bgcolor: "rgba(44, 36, 30, 0.05)",
                    px: 0.85,
                    py: 0.35,
                    borderRadius: 1,
                    lineHeight: 1.3,
                  }}
                >
                  {entry.attribute}: {entry.value}
                </Typography>
              ))}
            </Box>
          ) : null}

          <CartLinePrice item={item} />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          pt: compact ? 1.25 : 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <QuantityStepper
          value={item.quantity}
          min={item.quantityLimits.minimum}
          max={item.quantityLimits.maximum}
          disabled={busy || !item.quantityLimits.editable}
          onChange={onQuantity}
        />
        <Box sx={{ textAlign: "start", minWidth: 0 }}>
          <Typography
            color="text.secondary"
            sx={{ fontSize: 11, lineHeight: 1.2, mb: 0.25 }}
          >
            סה״כ
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? 16 : 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {lineTotal}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

export function CartLineItemSkeleton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const imageSize = compact ? 88 : 112;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 1.25 : 1.5,
        p: compact ? 1.5 : 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: "0 1px 2px rgba(28, 24, 20, 0.04)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: compact ? 1.5 : 2,
          alignItems: "flex-start",
        }}
      >
        <Skeleton
          variant="rectangular"
          animation="wave"
          width={imageSize}
          height={imageSize}
          sx={{ ...bone, borderRadius: 1.5, flexShrink: 0 }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton
                variant="rectangular"
                animation="wave"
                height={16}
                width="94%"
                sx={{ ...bone, mb: 0.75 }}
              />
              <Skeleton
                variant="rectangular"
                animation="wave"
                height={16}
                width="70%"
                sx={bone}
              />
            </Box>
            <Skeleton
              variant="circular"
              animation="wave"
              width={32}
              height={32}
              sx={bone}
            />
          </Box>
          <Skeleton
            variant="rectangular"
            animation="wave"
            height={17}
            width={88}
            sx={bone}
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: compact ? 1.25 : 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Skeleton
          variant="rectangular"
          animation="wave"
          width={100}
          height={36}
          sx={{ ...bone, borderRadius: 1 }}
        />
        <Box>
          <Skeleton
            variant="rectangular"
            animation="wave"
            height={11}
            width={64}
            sx={{ ...bone, mb: 0.5 }}
          />
          <Skeleton
            variant="rectangular"
            animation="wave"
            height={18}
            width={72}
            sx={bone}
          />
        </Box>
      </Box>
    </Box>
  );
}
