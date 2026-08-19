import { useQuery } from "@tanstack/react-query";
import { Box, Button, Container, FormControl, InputLabel, MenuItem, Select, Skeleton, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct } from "../api/store";
import { ProductGallery } from "../components/ProductGallery";
import { ProductGrid } from "../components/ProductGrid";
import { Price } from "../components/Price";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { EmptyState, ErrorState } from "../components/States";
import { useCartMutations } from "../hooks/useCart";
import { useAllCategories, useProductList } from "../hooks/useCatalog";
import { useUiStore } from "../store/ui";
import { categoryAncestors, crumbGroup, storefrontHref } from "../storefront/map";
import { decodeSlug } from "../utils/format";
import type { Product } from "../api/types";

const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

function Bone(props: { width?: number | string; height?: number | string; sx?: object }) {
  return (
    <Skeleton
      variant="rectangular"
      animation="wave"
      width={props.width}
      height={props.height}
      sx={{ ...bone, ...props.sx }}
    />
  );
}

function RelatedProductsSkeleton() {
  return (
    <Box sx={{ mt: 8 }} aria-busy="true" aria-label="טוען מוצרים קשורים">
      <Bone width={180} height={32} sx={{ mb: 3 }} />
      <ProductGrid products={[]} loading skeletonCount={4} />
    </Box>
  );
}

function ProductPageSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }} aria-busy="true" aria-label="טוען מוצר">
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center", mb: 2 }}>
        <Bone width={32} height={14} />
        <Bone width={8} height={10} />
        <Bone width={72} height={14} />
        <Bone width={8} height={10} />
        <Bone width={110} height={14} />
        <Bone width={8} height={10} />
        <Bone width={180} height={14} />
      </Box>
      <Box sx={{ display: "grid", gap: 5, gridTemplateColumns: { md: "1fr 1fr" } }}>
        <Box>
          <Bone sx={{ aspectRatio: "1 / 1", width: "100%", height: "auto", mb: 1.5 }} />
          <Box sx={{ display: "flex", gap: 1 }}>
            {Array.from({ length: 4 }, (_, index) => (
              <Bone key={index} width={72} height={72} />
            ))}
          </Box>
        </Box>
        <Box>
          <Bone width="92%" height={36} sx={{ mb: 1 }} />
          <Bone width="70%" height={36} sx={{ mb: 1 }} />
          <Bone width={120} height={18} sx={{ mb: 2 }} />
          <Bone width={140} height={32} sx={{ mb: 2 }} />
          <Bone width={96} height={18} />
          <Box sx={{ display: "flex", gap: 1.5, mt: 3, alignItems: "center" }}>
            <Bone width={120} height={56} />
            <Bone width={180} height={56} />
          </Box>
          <Bone width="80%" height={16} sx={{ mt: 3 }} />
        </Box>
      </Box>
      <Box sx={{ mt: 6, maxWidth: 760 }}>
        <Bone width="100%" height={16} sx={{ mb: 1 }} />
        <Bone width="100%" height={16} sx={{ mb: 1 }} />
        <Bone width="68%" height={16} />
      </Box>
      <Box sx={{ mt: 4 }}>
        <Bone width={72} height={28} sx={{ mb: 2 }} />
        <Bone width={280} height={18} sx={{ mb: 0.75 }} />
        <Bone width={220} height={18} sx={{ mb: 0.75 }} />
        <Bone width={260} height={18} />
      </Box>
      <RelatedProductsSkeleton />
    </Container>
  );
}

function selectedVariationId(product: Product, selected: Record<string, string>) {
  if (!product.hasOptions) return product.id;
  const match = product.variations.find((variation) =>
    variation.attributes.every((attribute) => {
      const chosen = selected[attribute.name];
      if (!chosen) return false;
      if (chosen === attribute.value) return true;
      const definition = product.attributes.find(
        (entry) => entry.name === attribute.name || entry.taxonomy === attribute.name,
      );
      const term = definition?.terms.find((item) => item.slug === chosen || item.name === chosen);
      return Boolean(term && (term.slug === attribute.value || term.name === attribute.value));
    }),
  );
  return match?.id;
}

export function ProductPage() {
  const { slug } = useParams();
  const idOrSlug = slug ? decodeSlug(slug) : "";
  const productQuery = useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: () => getProduct(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
  const product = productQuery.data;
  const { addItem } = useCartMutations();
  const addedProductId = useUiStore((state) => state.addedProductId);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const variationId = useMemo(
    () => (product ? selectedVariationId(product, selected) : undefined),
    [product, selected],
  );
  const related = useProductList(
    { category: product?.categories[0]?.id, perPage: 5, orderby: "date", order: "desc" },
    Boolean(product?.categories[0]?.id),
  );
  const categories = useAllCategories();
  const primaryCategory = categories.data?.find((category) => category.id === product?.categories[0]?.id);

  if (productQuery.isLoading) {
    return <ProductPageSkeleton />;
  }
  if (productQuery.isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <ErrorState message={(productQuery.error as Error).message} onRetry={() => productQuery.refetch()} />
      </Container>
    );
  }
  if (!product) {
    return <EmptyState title="המוצר לא נמצא." />;
  }

  const variationAttributes = product.attributes.filter((attribute) => attribute.hasVariations);
  const trail = primaryCategory && categories.data ? categoryAncestors(categories.data, primaryCategory) : [];
  const group = primaryCategory && categories.data ? crumbGroup(primaryCategory, categories.data) : null;
  const crumbs = [
    { label: "בית", to: "/" },
    ...(group ? [group] : []),
    ...trail.map((item) => ({ label: item.name, to: storefrontHref(item) })),
    { label: product.name },
  ];
  const relatedItems = (related.data?.items ?? []).filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Breadcrumbs items={crumbs} />
      <Box sx={{ display: "grid", gap: 5, gridTemplateColumns: { md: "1fr 1fr" } }}>
        <ProductGallery images={product.images} name={product.name} />
        <Box>
          <Typography variant="h3" mb={1}>
            {product.name}
          </Typography>
          {product.sku ? (
            <Typography color="text.secondary" mb={2}>
              מק״ט {product.sku}
            </Typography>
          ) : null}
          <Price prices={product.prices} size="lg" />
          <Typography sx={{ mt: 2 }} color={product.isInStock ? "text.primary" : "secondary"}>
            {product.stockAvailability.text || (product.isInStock ? "קיים במלאי" : "אזל מהמלאי")}
          </Typography>
          {variationAttributes.map((attribute) => (
            <FormControl fullWidth key={attribute.id} sx={{ mt: 2 }}>
              <InputLabel>{attribute.name}</InputLabel>
              <Select
                label={attribute.name}
                value={selected[attribute.name] ?? ""}
                onChange={(event) => setSelected((current) => ({ ...current, [attribute.name]: event.target.value }))}
              >
                {attribute.terms.map((term) => (
                  <MenuItem key={term.id} value={term.slug}>
                    {term.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          <Box sx={{ display: "flex", gap: 1.5, mt: 3, alignItems: "center" }}>
            <TextField
              type="number"
              label="כמות"
              value={qty}
              onChange={(event) => setQty(Number(event.target.value))}
              inputProps={{ min: product.addToCart.minimum, max: product.addToCart.maximum }}
              sx={{ width: 120 }}
              disabled={!product.isInStock}
            />
            <Button
              variant="contained"
              size="large"
              disabled={
                !product.isInStock ||
                !product.isPurchasable ||
                addItem.isPending ||
                (product.hasOptions && product.variations.length > 0 && !variationId)
              }
              onClick={() => {
                const id = variationId ?? product.id;
                addItem.mutate({ id, quantity: qty });
              }}
            >
              {!product.isInStock
                ? product.stockAvailability.text || "אזל מהמלאי"
                : product.hasOptions && product.variations.length > 0 && !variationId
                  ? "בחרו אפשרות"
                  : addItem.isPending
                    ? "מוסיפים…"
                    : addedProductId === (variationId ?? product.id)
                      ? "נוסף לסל"
                      : product.addToCart.singleText || product.addToCart.text || "הוספה לסל"}
            </Button>
          </Box>
          {addItem.isError ? (
            <Box mt={2}>
              <ErrorState message={(addItem.error as Error).message} />
            </Box>
          ) : null}
          <Typography variant="body2" color="text.secondary" mt={3}>
            משלוח מחושב בעגלה לפי ההגדרות ב־WooCommerce. איסוף מקומי זמין כשהחנות מחזירה אותו.
          </Typography>
        </Box>
      </Box>
      {product.description || product.shortDescription ? (
        <Box sx={{ mt: 6, maxWidth: 760 }} dangerouslySetInnerHTML={{ __html: product.description || product.shortDescription }} />
      ) : null}
      {product.attributes.length ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" mb={2}>
            מפרט
          </Typography>
          {product.attributes.map((attribute) => (
            <Typography key={attribute.id} sx={{ mb: 0.75 }}>
              <strong>{attribute.name}:</strong> {attribute.terms.map((term) => term.name).join(", ")}
            </Typography>
          ))}
        </Box>
      ) : null}
      {related.isLoading ? (
        <RelatedProductsSkeleton />
      ) : relatedItems.length ? (
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" mb={3}>
            מוצרים קשורים
          </Typography>
          <ProductGrid
            products={relatedItems}
            onAdd={(item) => addItem.mutate({ id: item.id, quantity: item.addToCart.minimum || 1 })}
            addingId={addItem.isPending ? addItem.variables?.id ?? null : null}
          />
        </Box>
      ) : null}
    </Container>
  );
}
