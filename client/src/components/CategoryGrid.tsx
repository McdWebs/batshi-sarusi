import { Box, Link as MuiLink, Skeleton, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Category } from "../api/types";
import { getProducts } from "../api/store";
import { categoryPathFromPermalink } from "../utils/format";
import { StoreImage } from "./StoreImage";

function imageKey(src: string) {
  return src.replace(/-\d+x\d+(?=\.\w+$)/, "").split("?")[0];
}

function useUniqueCategoryImages(categories: Category[]) {
  const previews = useQueries({
    queries: categories.map((category) => ({
      queryKey: ["category-preview", category.id],
      queryFn: () => getProducts({ category: category.id, perPage: 24, orderby: "date", order: "desc" }),
      enabled: !category.image?.src,
      staleTime: 5 * 60_000,
    })),
  });

  const images = useMemo(() => {
    const usedImages = new Set<string>();
    const usedProducts = new Set<number>();
    const byCategory = new Map<number, { src: string; alt: string }>();

    categories.forEach((category, index) => {
      if (category.image?.src) {
        const src = category.image.thumbnail || category.image.src;
        usedImages.add(imageKey(src));
        byCategory.set(category.id, { src, alt: category.image.alt || category.name });
        return;
      }
      const items = previews[index]?.data?.items ?? [];
      for (const product of items) {
        if (usedProducts.has(product.id)) continue;
        const image = product.images[0];
        const src = image?.thumbnail || image?.src;
        if (!src) continue;
        const key = imageKey(src);
        if (usedImages.has(key)) continue;
        usedProducts.add(product.id);
        usedImages.add(key);
        byCategory.set(category.id, { src, alt: category.name });
        break;
      }
    });
    return byCategory;
  }, [categories, previews]);

  return {
    images,
    loading: previews.some((preview, index) => !categories[index]?.image?.src && preview.isLoading),
  };
}

export function CategoryCard({
  category,
  src,
  loading,
}: {
  category: Category;
  src?: string;
  loading?: boolean;
}) {
  return (
    <MuiLink
      component={Link}
      to={categoryPathFromPermalink(category.permalink)}
      underline="none"
      color="inherit"
      sx={{ display: "block" }}
    >
      <Box
        sx={{
          aspectRatio: "4 / 3",
          bgcolor: "#EDE4D6",
          mb: 1.25,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1.5,
          py: 1.25,
        }}
      >
        {loading ? (
          <Skeleton variant="rectangular" animation="wave" sx={{ width: "100%", height: "100%", transform: "none", bgcolor: "#EDE4D6" }} />
        ) : src ? (
          <StoreImage
            src={src}
            alt={category.name}
            objectFit="contain"
            mixBlendMode="multiply"
            sx={{ width: "100%", height: "100%" }}
          />
        ) : null}
      </Box>
      <Typography fontWeight={600}>{category.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {category.count} מוצרים
      </Typography>
    </MuiLink>
  );
}

const gridSx = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
};

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Box sx={gridSx}>
      {Array.from({ length: count }, (_, index) => (
        <Box key={index}>
          <Skeleton variant="rectangular" animation="wave" sx={{ aspectRatio: "4 / 3", width: "100%", mb: 1.25, transform: "none", bgcolor: "#E7DDD0" }} />
          <Skeleton variant="text" animation="wave" sx={{ width: "70%", bgcolor: "#EDE4D6" }} />
          <Skeleton variant="text" animation="wave" sx={{ width: 80, bgcolor: "#EDE4D6" }} />
        </Box>
      ))}
    </Box>
  );
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { images, loading } = useUniqueCategoryImages(categories);

  return (
    <Box sx={gridSx}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          src={images.get(category.id)?.src}
          loading={loading && !images.get(category.id)}
        />
      ))}
    </Box>
  );
}
