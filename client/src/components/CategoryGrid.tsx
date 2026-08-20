import { Box, Link as MuiLink, Skeleton, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Category } from "../api/types";
import { getCategoryPreviews } from "../api/store";
import { prefetchCategoryCatalog } from "../hooks/prefetch";
import { categoryPathFromPermalink } from "../utils/format";
import { StoreImage } from "./StoreImage";

function imageKey(src: string) {
  return src.replace(/-\d+x\d+(?=\.\w+$)/, "").split("?")[0];
}

function useUniqueCategoryImages(categories: Category[]) {
  const missingIds = useMemo(
    () => categories.filter((category) => !category.image?.src).map((category) => category.id),
    [categories],
  );
  const previews = useQuery({
    queryKey: ["category-previews", missingIds],
    queryFn: () => getCategoryPreviews(missingIds),
    enabled: missingIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const images = useMemo(() => {
    const usedImages = new Set<string>();
    const byCategory = new Map<number, { src: string; alt: string }>();

    for (const category of categories) {
      if (!category.image?.src) continue;
      const src = category.image.thumbnail || category.image.src;
      usedImages.add(imageKey(src));
      byCategory.set(category.id, { src, alt: category.image.alt || category.name });
    }

    for (const category of categories) {
      if (byCategory.has(category.id)) continue;
      const preview = previews.data?.[category.id];
      if (!preview?.src) continue;
      const key = imageKey(preview.src);
      if (usedImages.has(key)) continue;
      usedImages.add(key);
      byCategory.set(category.id, { src: preview.src, alt: preview.alt || category.name });
    }

    return byCategory;
  }, [categories, previews.data]);

  return {
    images,
    loading: previews.isLoading && missingIds.length > 0,
  };
}

const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

export function CategoryCard({
  category,
  src,
  loading,
}: {
  category: Category;
  src?: string;
  loading?: boolean;
}) {
  const queryClient = useQueryClient();

  return (
    <MuiLink
      component={Link}
      to={categoryPathFromPermalink(category.permalink)}
      underline="none"
      color="inherit"
      sx={{ display: "block" }}
      onMouseEnter={() => prefetchCategoryCatalog(queryClient, category.id)}
      onFocus={() => prefetchCategoryCatalog(queryClient, category.id)}
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
          <Skeleton variant="rectangular" animation="wave" sx={{ width: "100%", height: "100%", ...bone }} />
        ) : src ? (
          <StoreImage
            src={src}
            alt={category.name}
            sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"
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

function CategoryCardSkeleton() {
  return (
    <Box sx={{ display: "block" }} aria-hidden>
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
        <Skeleton variant="rectangular" animation="wave" sx={{ width: "100%", height: "100%", ...bone }} />
      </Box>
      <Skeleton variant="rectangular" animation="wave" height={24} width="78%" sx={{ ...bone, mb: 0.75 }} />
      <Skeleton variant="rectangular" animation="wave" height={18} width={88} sx={bone} />
    </Box>
  );
}

const gridSx = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
} as const;

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Box sx={gridSx} aria-busy="true" aria-label="טוען קטגוריות">
      {Array.from({ length: count }, (_, index) => (
        <CategoryCardSkeleton key={index} />
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
