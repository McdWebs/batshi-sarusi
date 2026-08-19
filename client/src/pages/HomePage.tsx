import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useProductList, useAllCategories } from "../hooks/useCatalog";
import { ProductGrid } from "../components/ProductGrid";
import { CategoryGrid } from "../components/CategoryGrid";
import { ErrorState, LoadingState } from "../components/States";
import { useCartMutations } from "../hooks/useCart";
import { productPath } from "../utils/format";
import { collections, departments } from "../storefront/map";
import { StoreImage } from "../components/StoreImage";

export function HomePage() {
  const deals = useProductList({ onSale: true, perPage: 8, orderby: "date", order: "desc" });
  const categories = useAllCategories();
  const { addItem } = useCartMutations();
  const collectionItems = collections(categories.data ?? []);
  const departmentItems = departments(categories.data ?? []);
  const hero = deals.data?.items[0];

  const onAdd = (product: { id: number; addToCart: { minimum: number } }) =>
    addItem.mutate({ id: product.id, quantity: product.addToCart.minimum || 1 });

  return (
    <Box>
      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, display: "grid", gap: 4, gridTemplateColumns: { md: "1.1fr 0.9fr" }, alignItems: "center" }}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 56 }, mb: 2 }}>
              בתשי הום
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={3} fontWeight={400}>
              בית לאוהבי הבישול והאירוח. כל המוצרים והמחירים מגיעים מהחנות החיה.
            </Typography>
            <Button component={Link} to="/sale" variant="contained" size="large" sx={{ mr: 1 }}>
              למבצעים
            </Button>
            <Button component={Link} to="/collections" variant="outlined" size="large">
              לקולקציות
            </Button>
          </Box>
          {hero?.images[0] ? (
            <Box component={Link} to={productPath(hero.slug)} sx={{ display: "block" }}>
              <StoreImage src={hero.images[0].src} alt={hero.name} loading="eager" sx={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }} />
            </Box>
          ) : deals.isLoading ? (
            <LoadingState rows={1} />
          ) : null}
        </Container>
      </Box>

      <Container id="collections" maxWidth="lg" sx={{ py: 7, scrollMarginTop: 96 }}>
        <Typography variant="h3" mb={3}>
          קולקציות
        </Typography>
        {categories.isError ? (
          <ErrorState message={(categories.error as Error).message} onRetry={() => categories.refetch()} />
        ) : (
          <CategoryGrid categories={collectionItems} />
        )}
      </Container>

      <Container maxWidth="lg" sx={{ py: 2, pb: 7 }}>
        <Typography variant="h3" mb={3}>
          מבצעים עכשיו
        </Typography>
        {deals.isError ? (
          <ErrorState message={(deals.error as Error).message} onRetry={() => deals.refetch()} />
        ) : (
          <ProductGrid
            products={deals.data?.items ?? []}
            loading={deals.isLoading}
            onAdd={onAdd}
            addingId={addItem.isPending ? addItem.variables?.id ?? null : null}
          />
        )}
        <Box mt={3}>
          <Button component={Link} to="/sale">
            לכל המבצעים
          </Button>
        </Box>
      </Container>

      <Container id="departments" maxWidth="lg" sx={{ py: 2, pb: 8, scrollMarginTop: 96 }}>
        <Typography variant="h3" mb={3}>
          מחלקות
        </Typography>
        {categories.isError ? (
          <ErrorState message={(categories.error as Error).message} onRetry={() => categories.refetch()} />
        ) : (
          <CategoryGrid categories={departmentItems} />
        )}
      </Container>
    </Box>
  );
}
