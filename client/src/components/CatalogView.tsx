import { Box, Chip, Container, FormControl, InputLabel, MenuItem, Pagination, Select, Skeleton, Typography } from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ProductQuery } from "../api/types";
import { getProducts, searchProducts } from "../api/store";
import { ProductGrid } from "../components/ProductGrid";
import { EmptyState, ErrorState } from "../components/States";
import { Breadcrumbs, type Crumb } from "../components/Breadcrumbs";
import { useCartMutations } from "../hooks/useCart";
import { ApiError } from "../api/client";

const SORT_WIDTH = 180;
const SORT_HEIGHT = 40;

export function CatalogView({
  title,
  query,
  search,
  crumbs,
  chips,
  header,
  empty,
  enabled = true,
}: {
  title: string;
  query: Omit<ProductQuery, "page" | "perPage" | "orderby" | "order">;
  search?: string;
  crumbs?: Crumb[];
  chips?: Array<{ label: string; to: string }>;
  header?: ReactNode;
  empty?: ReactNode;
  enabled?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || "1");
  const orderby = (params.get("orderby") as ProductQuery["orderby"]) || "date";
  const order = (params.get("order") as ProductQuery["order"]) || "desc";
  const perPage = 12;
  const listQuery = { ...query, page, perPage, orderby, order };
  const searchReady = search === undefined || search.trim().length > 0;
  const list = useQuery({
    queryKey: ["catalog", search ?? "", listQuery],
    queryFn: () => (search ? searchProducts(search, listQuery) : getProducts(listQuery)),
    enabled: enabled && searchReady,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const { addItem } = useCartMutations();
  // First load: the sort control, the count and the grid all show placeholders.
  const showSkeleton = !list.data && (list.isPending || !enabled);
  // New sort, page, filter or category: the previous results are still in hand, but they belong to the old request,
  // so the grid shows placeholder cards instead of old products that are about to be replaced. The control stays live.
  const switching = list.isPlaceholderData;

  const chrome = (
    <>
      {crumbs?.length ? <Breadcrumbs items={crumbs} /> : null}
      <Typography variant="h3" mb={2}>
        {title}
      </Typography>
      {header}
      {chips?.length ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
          {chips.map((chip) => (
            <Chip key={chip.to} label={chip.label} component={Link} to={chip.to} clickable />
          ))}
        </Box>
      ) : null}
    </>
  );

  if (search !== undefined && !search.trim()) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {chrome}
        {empty ?? <EmptyState title="הקלידו בשדה למעלה כדי לחפש מוצרים וקולקציות." />}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {chrome}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        {list.data ? (
          <Typography color="text.secondary">{`${list.data.total} מוצרים`}</Typography>
        ) : showSkeleton ? (
          <Skeleton
            variant="text"
            animation="wave"
            aria-label="טוען מספר מוצרים"
            sx={{ width: 96, height: 24, bgcolor: "#EDE4D6", transform: "none" }}
          />
        ) : (
          <Typography color="text.secondary">&nbsp;</Typography>
        )}
        {/* Fixed box: the placeholder and the real control are the same size, so swapping them moves nothing. */}
        <Box sx={{ width: SORT_WIDTH, height: SORT_HEIGHT, flexShrink: 0 }} aria-busy={showSkeleton || undefined}>
          {showSkeleton ? (
            <Skeleton
              variant="rectangular"
              animation="wave"
              aria-label="טוען אפשרויות מיון"
              sx={{ width: "100%", height: "100%", bgcolor: "#EDE4D6", transform: "none", borderRadius: "2px" }}
            />
          ) : (
            <FormControl size="small" fullWidth>
              <InputLabel>מיון</InputLabel>
              <Select
                label="מיון"
                value={`${orderby}:${order}`}
                onChange={(event) => {
                  const [nextOrderby, nextOrder] = event.target.value.split(":");
                  params.set("orderby", nextOrderby ?? "date");
                  params.set("order", nextOrder ?? "desc");
                  params.set("page", "1");
                  setParams(params);
                }}
              >
                <MenuItem value="date:desc">חדש יותר</MenuItem>
                <MenuItem value="price:asc">מחיר: זול ליקר</MenuItem>
                <MenuItem value="price:desc">מחיר: יקר לזול</MenuItem>
                <MenuItem value="popularity:desc">הכי נמכרים</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
      {list.isError ? (
        <ErrorState message={(list.error as ApiError).message} onRetry={() => list.refetch()} />
      ) : list.data && list.data.items.length === 0 && !switching ? (
        <EmptyState title="לא מצאנו מוצרים כאן." body="נסו חיפוש, או חזרו למבצעים." />
      ) : (
        <ProductGrid
          products={list.data?.items ?? []}
          loading={showSkeleton || switching}
          skeletonCount={perPage}
          priorityCount={4}
          addingId={addItem.isPending ? addItem.variables?.id ?? null : null}
          onAdd={(product) =>
            addItem.mutate({ id: product.id, quantity: product.addToCart.minimum || 1 })
          }
        />
      )}
      {addItem.isError ? (
        <Box mt={2}>
          <ErrorState message={(addItem.error as Error).message} />
        </Box>
      ) : null}
      {list.data && list.data.totalPages > 1 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <Pagination
            page={page}
            count={list.data.totalPages}
            onChange={(_event, next) => {
              params.set("page", String(next));
              setParams(params);
              window.scrollTo({ top: 0 });
            }}
          />
        </Box>
      ) : null}
    </Container>
  );
}
