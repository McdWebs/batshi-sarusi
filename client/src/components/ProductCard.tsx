import { Box, Button, Chip, Link as MuiLink, Skeleton, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "../api/types";
import { prefetchProduct } from "../hooks/prefetch";
import { productPath } from "../utils/format";
import { useUiStore } from "../store/ui";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

export function ProductCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  adding?: boolean;
}) {
  const queryClient = useQueryClient();
  const image = product.images[0];
  const hover = product.images[1];
  const canQuickAdd = Boolean(product.isPurchasable && product.isInStock && !product.hasOptions && onAdd);
  const justAdded = useUiStore((state) => state.addedProductId === product.id);
  const path = productPath(product.slug);
  const warm = () => prefetchProduct(queryClient, product.slug);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <MuiLink
        component={Link}
        to={path}
        underline="none"
        color="inherit"
        sx={{ display: "block", position: "relative", mb: 1.5 }}
        onMouseEnter={warm}
        onFocus={warm}
      >
        <Box
          sx={{
            aspectRatio: "1 / 1",
            bgcolor: "#EDE4D6",
            overflow: "hidden",
            position: "relative",
            "&:hover .product-card-hover": { opacity: 1 },
            "&:hover .product-card-main": { opacity: hover ? 0 : 1 },
          }}
        >
          {image ? (
            <StoreImage
              className="product-card-main"
              src={image.thumbnail || image.src}
              srcSet={image.srcset}
              sizes={image.sizes || "(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"}
              alt={image.alt || product.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "opacity 0.2s ease",
              }}
            />
          ) : null}
          {hover ? (
            <StoreImage
              className="product-card-hover"
              src={hover.thumbnail || hover.src}
              srcSet={hover.srcset}
              sizes={hover.sizes || "(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"}
              alt=""
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0,
                pointerEvents: "none",
                transition: "opacity 0.2s ease",
              }}
            />
          ) : null}
        </Box>
        <Box sx={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 0.5 }}>
          {product.onSale ? (
            <Chip label="מבצע" size="small" color="secondary" sx={{ color: "white", borderRadius: 0 }} />
          ) : null}
          {!product.isInStock ? (
            <Chip label="אזל" size="small" sx={{ borderRadius: 0, bgcolor: "rgba(28,24,20,0.8)", color: "white" }} />
          ) : null}
        </Box>
      </MuiLink>
      <Typography
        component={Link}
        to={path}
        variant="subtitle1"
        onMouseEnter={warm}
        onFocus={warm}
        sx={{
          color: "inherit",
          textDecoration: "none",
          fontWeight: 500,
          lineHeight: 1.35,
          mb: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: 44,
        }}
      >
        {product.name}
      </Typography>
      <Box sx={{ mt: "auto" }}>
        <Price prices={product.prices} size="sm" />
        {product.isInStock ? (
          canQuickAdd ? (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1.5, bgcolor: justAdded && !adding ? "secondary.main" : undefined }}
              disabled={adding}
              onClick={() => onAdd?.(product)}
            >
              {adding ? "מוסיפים…" : justAdded ? "נוסף לסל" : product.addToCart.text || "הוספה לסל"}
            </Button>
          ) : product.hasOptions ? (
            <Button fullWidth variant="outlined" sx={{ mt: 1.5 }} component={Link} to={productPath(product.slug)}>
              בחירת אפשרות
            </Button>
          ) : null
        ) : (
          <Button fullWidth variant="contained" sx={{ mt: 1.5 }} disabled>
            {product.stockAvailability.text || "אזל מהמלאי"}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ aspectRatio: "1 / 1", width: "100%", height: "auto", bgcolor: "#EDE4D6", mb: 1.5, transform: "none" }}
      />
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ height: 44, width: "85%", mb: 1, bgcolor: "#EDE4D6", transform: "none" }}
      />
      <Box sx={{ mt: "auto" }}>
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ height: 16, width: 72, bgcolor: "#EDE4D6", transform: "none" }}
        />
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ mt: 1.5, height: 44, width: "100%", bgcolor: "#EDE4D6", transform: "none" }}
        />
      </Box>
    </Box>
  );
}
