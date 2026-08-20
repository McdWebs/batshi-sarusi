import { Box } from "@mui/material";
import type { Product } from "../api/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

const gridSx = {
  display: "grid",
  gap: { xs: 2, md: 3 },
  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
} as const;

export function ProductGrid({
  products,
  onAdd,
  addingId,
  loading,
  refreshing,
  skeletonCount = 8,
}: {
  products: Product[];
  onAdd?: (product: Product) => void;
  addingId?: number | null;
  loading?: boolean;
  refreshing?: boolean;
  skeletonCount?: number;
}) {
  if (loading) {
    return (
      <Box sx={gridSx}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...gridSx,
        opacity: refreshing ? 0.55 : 1,
        transition: "opacity 0.15s ease",
        pointerEvents: refreshing ? "none" : "auto",
      }}
      aria-busy={refreshing || undefined}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} adding={addingId === product.id} />
      ))}
    </Box>
  );
}
