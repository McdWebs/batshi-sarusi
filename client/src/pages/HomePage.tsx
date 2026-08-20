import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useProductList, useAllCategories } from "../hooks/useCatalog";
import { ProductGrid } from "../components/ProductGrid";
import { CategoryGrid, CategoryGridSkeleton } from "../components/CategoryGrid";
import { ErrorState } from "../components/States";
import { useCartMutations } from "../hooks/useCart";
import { collections, departments, COLLECTION_SLUGS, DEPARTMENT_SLUGS } from "../storefront/map";
import { HomeHero } from "../components/HomeHero";

export function HomePage() {
  const deals = useProductList({
    onSale: true,
    perPage: 8,
    orderby: "date",
    order: "desc",
  });
  const popular = useProductList({
    perPage: 7,
    orderby: "popularity",
    order: "desc",
  });
  const categories = useAllCategories();
  const { addItem } = useCartMutations();
  const collectionItems = collections(categories.data ?? []);
  const departmentItems = departments(categories.data ?? []);
  const heroProducts = popular.data?.items ?? [];

  const onAdd = (product: { id: number; addToCart: { minimum: number } }) =>
    addItem.mutate({
      id: product.id,
      quantity: product.addToCart.minimum || 1,
    });

  return (
    <Box>
      <HomeHero products={heroProducts} />

      <Container
        id="collections"
        maxWidth="lg"
        sx={{ py: 7, scrollMarginTop: 96 }}
      >
        <Typography variant="h3" mb={3}>
          קולקציות
        </Typography>
        {categories.isError ? (
          <ErrorState
            message={(categories.error as Error).message}
            onRetry={() => categories.refetch()}
          />
        ) : categories.isPending ? (
          <CategoryGridSkeleton count={COLLECTION_SLUGS.length} />
        ) : (
          <CategoryGrid categories={collectionItems} />
        )}
      </Container>

      <Container maxWidth="lg" sx={{ py: 2, pb: 7 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h3">מבצעים עכשיו</Typography>
          <Button
            component={Link}
            to="/sale"
            variant="contained"
            size="large"
            sx={{
              bgcolor: "secondary.main",
              color: "#F7F1E8",
              px: 4,
              "&:hover": { bgcolor: "#7A3424" },
            }}
          >
            לכל המבצעים
          </Button>
        </Box>
        {deals.isError ? (
          <ErrorState
            message={(deals.error as Error).message}
            onRetry={() => deals.refetch()}
          />
        ) : (
          <ProductGrid
            products={deals.data?.items ?? []}
            loading={deals.isPending}
            refreshing={deals.isFetching && !deals.isPending}
            onAdd={onAdd}
            addingId={
              addItem.isPending ? (addItem.variables?.id ?? null) : null
            }
          />
        )}
      </Container>

      <Container
        id="departments"
        maxWidth="lg"
        sx={{ py: 2, pb: 8, scrollMarginTop: 96 }}
      >
        <Typography variant="h3" mb={3}>
          מחלקות
        </Typography>
        {categories.isError ? (
          <ErrorState
            message={(categories.error as Error).message}
            onRetry={() => categories.refetch()}
          />
        ) : categories.isPending ? (
          <CategoryGridSkeleton count={DEPARTMENT_SLUGS.length} />
        ) : (
          <CategoryGrid categories={departmentItems} />
        )}
      </Container>
    </Box>
  );
}
