import { Box, Button, Typography } from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import { Link } from "react-router-dom";

type EmptyCartProps = {
  compact?: boolean;
  onNavigate?: () => void;
};

export function EmptyCart({ compact = false, onNavigate }: EmptyCartProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "relative",
        overflow: "hidden",
        flex: compact ? 1 : undefined,
        minHeight: compact
          ? undefined
          : { xs: "min(62vh, 520px)", md: "min(58vh, 560px)" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: compact ? 1 : { xs: 2, sm: 3 },
        py: compact ? 3 : { xs: 6, md: 8 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 70% 55% at 50% 28%, rgba(143, 61, 42, 0.12), transparent 58%),
            radial-gradient(ellipse 55% 45% at 82% 78%, rgba(44, 36, 30, 0.06), transparent 55%),
            radial-gradient(ellipse 45% 40% at 12% 70%, rgba(247, 241, 232, 0.9), transparent 50%)
          `,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: compact ? 300 : 420,
          textAlign: "center",
        }}
      >
        <Box
          aria-hidden
          sx={{
            mx: "auto",
            mb: compact ? 2.5 : 3.5,
            width: compact ? 88 : 112,
            height: compact ? 88 : 112,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(255, 251, 245, 0.85)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 18px 40px rgba(44, 36, 30, 0.08)",
          }}
        >
          <ShoppingBagOutlinedIcon
            sx={{
              fontSize: compact ? 36 : 46,
              color: "secondary.main",
              opacity: 0.92,
            }}
          />
        </Box>

        <Typography
          variant={compact ? "h5" : "h3"}
          component={compact ? "p" : "h1"}
          sx={{ mb: compact ? 1 : 1.5 }}
        >
          העגלה ריקה
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mb: compact ? 3 : 4,
            mx: "auto",
            maxWidth: compact ? 260 : 340,
            lineHeight: 1.7,
            fontSize: compact ? "0.95rem" : undefined,
          }}
        >
          עוד לא הוספתם מוצרים. גלו קולקציות ומבצעים בחנות — והם יופיעו כאן.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
            justifyContent: "center",
          }}
        >
          <Button
            component={Link}
            to="/shop"
            variant="contained"
            size={compact ? "medium" : "large"}
            onClick={onNavigate}
          >
            לחנות
          </Button>
          <Button
            component={Link}
            to="/sale"
            variant="outlined"
            size={compact ? "medium" : "large"}
            onClick={onNavigate}
          >
            למבצעים
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
