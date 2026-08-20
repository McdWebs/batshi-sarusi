import { CatalogView } from "../components/CatalogView";
import { useAllCategories, useBrands } from "../hooks/useCatalog";
import { decodeSlug, findCategoryByPath, brandPath } from "../utils/format";
import { categoryAncestors, categoryChildren, collections, COLLECTION_SLUGS, crumbGroup, departments, DEPARTMENT_SLUGS, searchStorefront, storefrontHref } from "../storefront/map";
import { EmptyState, ErrorState } from "../components/States";
import { CategoryGrid, CategoryGridSkeleton } from "../components/CategoryGrid";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Box, Chip, Container, InputBase, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Category } from "../api/types";

export function ShopPage() {
  return (
    <CatalogView
      title="כל המוצרים"
      query={{}}
      crumbs={[
        { label: "בית", to: "/" },
        { label: "כל המוצרים" },
      ]}
    />
  );
}

export function SalePage() {
  return (
    <CatalogView
      title="מבצעים"
      query={{ onSale: true }}
      crumbs={[
        { label: "בית", to: "/" },
        { label: "מבצעים" },
      ]}
    />
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);
  const categories = useAllCategories();
  const brands = useBrands();

  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = draft.trim();
      setParams(
        (current) => {
          const existing = (current.get("q") ?? "").trim();
          if (next === existing) return current;
          const copy = new URLSearchParams(current);
          if (next) copy.set("q", next);
          else copy.delete("q");
          copy.delete("page");
          return copy;
        },
        { replace: true },
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, setParams]);

  const allCategories = categories.data ?? [];
  const brandItems = brands.data?.items ?? [];
  const aisles = q.trim() ? searchStorefront(allCategories, q) : [];
  const popularSearches = useMemo(() => {
    const doors = [
      ...collections(allCategories).map((item) => ({ id: `c-${item.id}`, label: item.name, to: storefrontHref(item) })),
      ...brandItems.map((item) => ({ id: `b-${item.id}`, label: item.name, to: brandPath(item.slug) })),
      ...departments(allCategories).map((item) => ({ id: `d-${item.id}`, label: item.name, to: storefrontHref(item) })),
    ];
    const seen = new Set<string>();
    return doors.filter((item) => {
      if (seen.has(item.to)) return false;
      seen.add(item.to);
      return true;
    }).slice(0, 8);
  }, [allCategories, brandItems]);

  const needle = q.trim().toLowerCase();
  const matchedCategory = needle
    ? [...collections(allCategories), ...departments(allCategories)].find((item) => item.name.toLowerCase() === needle)
    : undefined;
  const matchedBrand = needle ? brandItems.find((item) => item.name.toLowerCase() === needle) : undefined;

  return (
    <CatalogView
      title="חיפוש"
      query={{
        category: matchedCategory?.id,
        brand: matchedBrand?.id,
      }}
      search={matchedCategory || matchedBrand ? undefined : q}
      crumbs={[
        { label: "בית", to: "/" },
        { label: "חיפוש" },
      ]}
      chips={aisles.map((item) => ({ label: item.name, to: storefrontHref(item) }))}
      header={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            px: 2,
            py: 1.5,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <SearchIcon sx={{ color: "text.secondary" }} />
          <InputBase
            autoFocus
            fullWidth
            placeholder="חיפוש מוצר, מותג או קולקציה"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            inputProps={{ "aria-label": "חיפוש" }}
            sx={{ fontSize: 18 }}
          />
        </Box>
      }
      empty={
        <Box>
          <Typography variant="h6" mb={2}>
            חיפושים נפוצים
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {popularSearches.map((item) => (
              <Chip key={item.id} label={item.label} component={Link} to={item.to} clickable />
            ))}
          </Box>
        </Box>
      }
    />
  );
}

export function DepartmentsPage() {
  return (
    <DirectoryPage
      title="מחלקות"
      empty="לא מצאנו מחלקות להצגה."
      pick={departments}
      skeletonCount={DEPARTMENT_SLUGS.length}
    />
  );
}

export function CollectionsPage() {
  return (
    <DirectoryPage
      title="קולקציות"
      empty="לא מצאנו קולקציות להצגה."
      pick={collections}
      skeletonCount={COLLECTION_SLUGS.length}
    />
  );
}

function DirectoryPage({
  title,
  empty,
  pick,
  skeletonCount = 8,
}: {
  title: string;
  empty: string;
  pick: (categories: Category[]) => Category[];
  skeletonCount?: number;
}) {
  const categories = useAllCategories();
  const items = pick(categories.data ?? []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Breadcrumbs items={[{ label: "בית", to: "/" }, { label: title }]} />
      <Typography variant="h3" mb={3}>
        {title}
      </Typography>
      {categories.isError ? (
        <ErrorState message={(categories.error as Error).message} onRetry={() => categories.refetch()} />
      ) : categories.isPending ? (
        <CategoryGridSkeleton count={skeletonCount} />
      ) : items.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <CategoryGrid categories={items} />
      )}
    </Container>
  );
}

export function CategoryPage({ splat }: { splat: string }) {
  const categories = useAllCategories();
  const match = findCategoryByPath(categories.data ?? [], splat);
  const fallbackTitle = decodeSlug(splat.split("/").filter(Boolean).at(-1) ?? "") || "קטגוריה";

  if (categories.isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <ErrorState message={(categories.error as Error).message} onRetry={() => categories.refetch()} />
      </Container>
    );
  }
  if (!categories.isPending && !match) {
    return <EmptyState title="הקטגוריה לא נמצאה." body="נסו חיפוש, או פתחו קולקציות מהתפריט." />;
  }

  const all = categories.data ?? [];
  const trail = match ? categoryAncestors(all, match) : [];
  const group = match ? crumbGroup(match, all) : null;
  const crumbs = [
    { label: "בית", to: "/" },
    ...(group ? [group] : []),
    ...trail.map((item, index) => ({
      label: item.name,
      to: index === trail.length - 1 ? undefined : storefrontHref(item),
    })),
  ];
  const chips = match
    ? categoryChildren(all, match.id)
        .slice(0, 12)
        .map((item) => ({ label: item.name, to: storefrontHref(item) }))
    : undefined;

  return (
    <CatalogView
      title={match?.name ?? fallbackTitle}
      query={{ category: match?.id }}
      crumbs={crumbs}
      chips={chips}
      enabled={Boolean(match)}
    />
  );
}

export function BrandPage({ slug }: { slug: string }) {
  const decoded = decodeSlug(slug);
  const brands = useBrands();
  const match = brands.data?.items.find(
    (brand) => decodeSlug(brand.slug) === decoded || decodeSlug(brand.permalink).endsWith(`/${decoded}`),
  );

  if (brands.isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <ErrorState message={(brands.error as Error).message} onRetry={() => brands.refetch()} />
      </Container>
    );
  }
  if (!brands.isPending && !match) {
    return <EmptyState title="המותג לא נמצא." />;
  }

  return (
    <CatalogView
      title={match?.name ?? decoded}
      query={{ brand: match?.id }}
      crumbs={[
        { label: "בית", to: "/" },
        { label: "קולקציות", to: "/collections" },
        { label: match?.name ?? decoded },
      ]}
      enabled={Boolean(match)}
    />
  );
}
