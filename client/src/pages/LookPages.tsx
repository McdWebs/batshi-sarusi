import { Box, Button, Chip, Container, Pagination, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LookCard } from "../components/ShopTheLook";
import { ProductGrid } from "../components/ProductGrid";
import { EmptyState, ErrorState } from "../components/States";
import { captureRef, findInfluencer, influencerShareLink, INFLUENCERS } from "../content/influencers";
import { LOOKS } from "../content/looks";
import { useCartMutations } from "../hooks/useCart";
import { useAllCategories, useProductList } from "../hooks/useCatalog";
import { categorySlug } from "../storefront/map";

const PER_PAGE = 12;

function errorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "";
}

export function ShopTheLookPage() {
  const [params, setParams] = useSearchParams();
  const by = params.get("by") ?? "";
  const active = findInfluencer(by);
  const looks = active ? LOOKS.filter((look) => look.influencer === active.slug) : LOOKS;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Breadcrumbs items={[{ label: "בית", to: "/" }, { label: "קנו את הלוק" }]} />
      <Typography variant="h3" mb={1}>
        קנו את הלוק
      </Typography>
      <Typography color="text.secondary" maxWidth={560} mb={2}>
        לחצו על הסימנים בתמונה כדי לראות את המוצר, המחיר והמלאי העדכניים מהחנות.
      </Typography>
      <Box
        role="note"
        sx={{
          display: "inline-block",
          px: 1.5,
          py: 0.75,
          mb: 3,
          bgcolor: "#EDE4D6",
          color: "primary.main",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        דוגמה להמחשה — פוסטים לדוגמה. אין כאן חיבור לאינסטגרם, והתמונות הן תמונות מוצר מהחנות.
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }} role="group" aria-label="סינון לפי מומלצים">
        <Chip
          label="הכל"
          clickable
          color={active ? "default" : "primary"}
          onClick={() => setParams({}, { replace: true })}
        />
        {INFLUENCERS.map((item) => (
          <Chip
            key={item.slug}
            label={item.name}
            clickable
            color={active?.slug === item.slug ? "primary" : "default"}
            onClick={() => setParams({ by: item.slug }, { replace: true })}
          />
        ))}
      </Box>
      {looks.length === 0 ? (
        <EmptyState title="אין עדיין לוקים להצגה." body="נסו לבחור סינון אחר." />
      ) : (
        <Box sx={{ display: "grid", gap: { xs: 5, md: 4 }, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
          {looks.map((look) => (
            <LookCard key={look.id} look={look} />
          ))}
        </Box>
      )}
    </Container>
  );
}

export function InfluencerPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const influencer = findInfluencer(slug);
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const categories = useAllCategories();
  const { addItem } = useCartMutations();

  const ref = params.get("ref");
  useEffect(() => {
    captureRef(ref);
  }, [ref]);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const category = influencer
    ? categories.data?.find((item) => categorySlug(item) === influencer.categorySlug)
    : undefined;
  const list = useProductList(
    { category: category?.id, page, perPage: PER_PAGE, orderby: "popularity", order: "desc" },
    Boolean(category),
  );

  if (!influencer) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Breadcrumbs items={[{ label: "בית", to: "/" }, { label: "המומלצים" }]} />
        <EmptyState title="לא מצאנו את העמוד הזה." body="בדקו את הקישור, או חזרו לקולקציות בחנות." />
        <Box sx={{ textAlign: "center" }}>
          <Button component={Link} to="/shop" variant="contained">
            לכל המוצרים
          </Button>
        </Box>
      </Container>
    );
  }

  const link = influencerShareLink(influencer.slug);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const showSkeleton = categories.isPending || (Boolean(category) && !list.data && list.isPending);
  const categoryMissing = !categories.isPending && !categories.isError && !category;

  return (
    <Box>
      <Box sx={{ bgcolor: "primary.main", color: "#F4EEE4", py: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ "& a": { color: "inherit" }, "& nav": { color: "rgba(244,238,228,0.75)" }, "& nav span": { color: "inherit !important" } }}>
            <Breadcrumbs items={[{ label: "בית", to: "/" }, { label: "המומלצים" }, { label: influencer.name }]} />
          </Box>
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: 36, md: 56 }, mb: 1.5 }}>
            {influencer.name}
          </Typography>
          <Typography sx={{ maxWidth: 560, fontSize: { xs: 16, md: 18 }, opacity: 0.9, mb: 3 }}>{influencer.tagline}</Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <Button component={Link} to={`/shop-the-look?by=${influencer.slug}`} variant="contained" color="secondary">
              קנו את הלוק
            </Button>
          </Box>
          <Box sx={{ mt: 4, maxWidth: 560 }}>
            <Typography sx={{ fontSize: 13, opacity: 0.75, mb: 0.75 }}>הקישור לשיתוף (קישור מעקב לדוגמה)</Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
              <Box
                dir="ltr"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  px: 1.5,
                  py: 1,
                  border: "1px solid rgba(244,238,228,0.35)",
                  fontSize: 14,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  userSelect: "all",
                }}
              >
                {link}
              </Box>
              <Button
                onClick={copy}
                startIcon={<ContentCopyIcon />}
                sx={{ color: "inherit", border: "1px solid rgba(244,238,228,0.35)", borderRadius: 0, whiteSpace: "nowrap" }}
              >
                {copied ? "הועתק" : "העתקה"}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography variant="h3" mb={1}>
          {`המומלצים של ${influencer.name}`}
        </Typography>
        {list.data ? (
          <Typography color="text.secondary" mb={3}>{`${list.data.total} מוצרים`}</Typography>
        ) : (
          <Box mb={3} />
        )}
        {categories.isError ? (
          <ErrorState message={errorMessage(categories.error)} onRetry={() => categories.refetch()} />
        ) : categoryMissing ? (
          <EmptyState title="הקולקציה הזו לא זמינה כרגע." body="נסו שוב מאוחר יותר, או עברו לכל המוצרים." />
        ) : list.isError ? (
          <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
        ) : list.data && list.data.items.length === 0 && !list.isPlaceholderData ? (
          <EmptyState title="אין כרגע מוצרים בקולקציה הזו." />
        ) : (
          <ProductGrid
            products={list.data?.items ?? []}
            loading={showSkeleton || list.isPlaceholderData}
            skeletonCount={PER_PAGE}
            addingId={addItem.isPending ? addItem.variables?.id ?? null : null}
            onAdd={(product) => addItem.mutate({ id: product.id, quantity: product.addToCart.minimum || 1 })}
          />
        )}
        {list.data && list.data.totalPages > 1 ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <Pagination
              page={page}
              count={list.data.totalPages}
              onChange={(_event, next) => {
                setPage(next);
                window.scrollTo({ top: 0 });
              }}
            />
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
