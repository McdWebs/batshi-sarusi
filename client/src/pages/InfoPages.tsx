import { Container, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getPage, getPages } from "../api/store";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { decodeSlug } from "../utils/format";

export function CmsPage() {
  const { slug } = useParams();
  const decoded = slug ? decodeSlug(slug) : "";
  const pages = useQuery({ queryKey: ["pages"], queryFn: getPages });
  const match = (pages.data ?? []).find((page) => decodeSlug(page.slug) === decoded || page.slug === decoded);
  const pageQuery = useQuery({
    queryKey: ["page", match?.slug ?? decoded],
    queryFn: () => getPage(match?.slug ?? decoded),
    enabled: Boolean(decoded),
  });

  if (pages.isLoading || pageQuery.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <LoadingState />
      </Container>
    );
  }
  if (pageQuery.isError) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <ErrorState message={(pageQuery.error as Error).message} onRetry={() => pageQuery.refetch()} />
      </Container>
    );
  }
  if (!pageQuery.data) {
    return <EmptyState title="העמוד לא נמצא." />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h3" mb={3}>
        {pageQuery.data.title}
      </Typography>
      <div dangerouslySetInnerHTML={{ __html: pageQuery.data.contentHtml }} />
    </Container>
  );
}

export function AccountPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" mb={2}>
        החשבון שלי
      </Typography>
      <Typography color="text.secondary">
        התחברות ולקוחות יחוברו בשלב הבא דרך WooCommerce. אין חשבון נפרד בחנות החדשה.
      </Typography>
    </Container>
  );
}

export function CheckoutBlockedPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" mb={2}>
        תשלום
      </Typography>
      <Typography color="text.secondary">
        תהליך התשלום (Grow / Meshulam) עדיין לא מחובר. העגלה חיה, אבל לא ניתן להשלים הזמנה כאן.
      </Typography>
    </Container>
  );
}

export function NotFoundPage() {
  return <EmptyState title="העמוד לא נמצא." />;
}
