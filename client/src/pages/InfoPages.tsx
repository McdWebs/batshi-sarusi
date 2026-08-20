import { Container, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getPage } from "../api/store";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { getStaticPage } from "../content/staticPages";
import { decodeSlug } from "../utils/format";

export function CmsPage() {
  const { slug } = useParams();
  const decoded = slug ? decodeSlug(slug) : "";
  const staticPage = decoded ? getStaticPage(decoded) : null;

  const pageQuery = useQuery({
    queryKey: ["page", decoded],
    queryFn: () => getPage(decoded),
    enabled: Boolean(decoded) && !staticPage,
    staleTime: 5 * 60_000,
  });

  if (staticPage) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h3" mb={3}>
          {staticPage.title}
        </Typography>
        <BoxProse html={staticPage.html} />
      </Container>
    );
  }

  if (pageQuery.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <LoadingState />
      </Container>
    );
  }
  if (pageQuery.isError) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <ErrorState
          message={(pageQuery.error as Error).message}
          onRetry={() => pageQuery.refetch()}
        />
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
      <BoxProse html={pageQuery.data.contentHtml} />
    </Container>
  );
}

function BoxProse({ html }: { html: string }) {
  return (
    <Typography
      component="div"
      sx={{
        "& h3": { mt: 3, mb: 1.5, fontFamily: '"Noto Serif Hebrew", serif' },
        "& p": { mb: 1.5, lineHeight: 1.7 },
        "& ul": { mb: 2, pr: 3 },
        "& li": { mb: 0.75, lineHeight: 1.6 },
        "& a": { color: "secondary.main" },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function AccountPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" mb={2}>
        החשבון שלי
      </Typography>
      <Typography color="text.secondary">
        התחברות ולקוחות יחוברו בשלב הבא דרך WooCommerce. אין חשבון נפרד בחנות
        החדשה.
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
    </Container>
  );
}

export function NotFoundPage() {
  return <EmptyState title="העמוד לא נמצא." />;
}
