import { Alert, Box, Container, Typography } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { parseDays, rangeInfo } from "../analytics/labels";
import { ApiError } from "../api/client";
import { getAnalyticsSummary } from "../api/store";
import { AccessCodeForm } from "../components/AccessCodeForm";
import { AnalyticsSkeleton } from "../components/analytics/AnalyticsSkeleton";
import { BrowsingSection } from "../components/analytics/BrowsingSection";
import { DailyChart } from "../components/analytics/DailyChart";
import { FunnelSection } from "../components/analytics/FunnelSection";
import { KpiRow } from "../components/analytics/KpiRow";
import { ProductsSection, SoldOutSection } from "../components/analytics/ProductsSection";
import { RangeSwitch } from "../components/analytics/RangeSwitch";
import { SearchSection } from "../components/analytics/SearchSection";
import { Section, TwoColumns } from "../components/analytics/shared";
import { SourcesSection } from "../components/analytics/SourcesSection";
import { EmptyState, ErrorState } from "../components/States";
import { setStudioKey } from "../studio/studioKey";

const linkSx = { color: "secondary.main", fontWeight: 600, fontSize: 14 } as const;

export function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const days = parseDays(params.get("days"));
  const range = rangeInfo(days);

  const query = useQuery({
    queryKey: ["studio", "analytics", days],
    queryFn: () => getAnalyticsSummary(days),
    staleTime: 0,
    placeholderData: keepPreviousData,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
  });
  const [codeTried, setCodeTried] = useState(false);
  const needsCode = query.error instanceof ApiError && query.error.status === 401;
  const summary = query.data;
  const refreshing = query.isFetching && !query.isLoading;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "secondary.main", mb: 0.5 }}>דמו פנימי</Typography>
      <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 26, md: 34 }, lineHeight: 1.2 }}>
        ניתוח האתר
      </Typography>
      <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 14, maxWidth: 560 }}>
        מי נכנס לחנות, מאיפה הוא הגיע, מה הוא חיפש ועד איפה הוא התקדם. בלי שמות ובלי פרטים אישיים.
      </Typography>
      <Box sx={{ mt: 1, mb: 3, display: "flex", gap: 2.5, flexWrap: "wrap" }}>
        <Typography component={RouterLink} to="/demand" sx={{ ...linkSx, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
          ביקוש למוצרים שאזלו
        </Typography>
        <Typography component={RouterLink} to="/studio" sx={{ ...linkSx, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
          סטודיו התוכן
        </Typography>
      </Box>

      <RangeSwitch
        days={days}
        onChange={(next) => {
          setParams(
            (current) => {
              const copy = new URLSearchParams(current);
              copy.set("days", String(next));
              return copy;
            },
            { replace: true },
          );
        }}
      />

      <Box sx={{ mt: 3 }} aria-busy={query.isFetching} aria-live="polite">
        {needsCode ? (
          <AccessCodeForm
            wrong={codeTried}
            onSubmit={(code) => {
              setStudioKey(code);
              setCodeTried(true);
              void query.refetch();
            }}
          />
        ) : query.isLoading ? (
          <AnalyticsSkeleton />
        ) : query.isError && !summary ? (
          <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
        ) : summary ? (
          <Box sx={{ opacity: refreshing ? 0.6 : 1 }}>
            {summary.hasDemoData ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                נתוני הדגמה: חלק מהנתונים כאן נוצרו אוטומטית להדגמה ואינם מבקרים אמיתיים
              </Alert>
            ) : null}

            {summary.kpis.sessions === 0 ? (
              <>
                <EmptyState
                  title={`עדיין אין נתונים ${range.span}.`}
                  body="הנתונים מופיעים אחרי שמבקרים באתר מאשרים עוגיות סטטיסטיקה. אם בחרתם טווח קצר, נסו טווח ארוך יותר."
                />
                <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: 14, mb: 1 }}>
                  להדגמה אפשר לטעון נתוני דוגמה. מי שמפתח את האתר מריץ בשורת הפקודה:
                </Typography>
                <Box
                  component="code"
                  dir="ltr"
                  sx={{ display: "block", width: "fit-content", mx: "auto", px: 2, py: 1, bgcolor: "#EDE4D6", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, userSelect: "all", maxWidth: "100%", overflowX: "auto" }}
                >
                  npm run analytics:seed-demo -w server
                </Box>
              </>
            ) : (
              <>
                <KpiRow kpis={summary.kpis} previous={summary.previous} previousLabel={range.previous} />
                <DailyChart daily={summary.daily} days={days} />
                <Section title="מסלול הלקוחות" intro={`איך הכניסות ${range.span} התחלקו בין השלבים של הקנייה, ומאיפה הן הגיעו.`}>
                  <TwoColumns>
                    <FunnelSection funnel={summary.funnel} totalSessions={summary.kpis.sessions} />
                    <SourcesSection sources={summary.sources} devices={summary.devices} totalSessions={summary.kpis.sessions} />
                  </TwoColumns>
                </Section>
                <ProductsSection topProducts={summary.topProducts} viewedNeverAdded={summary.viewedNeverAdded} />
                <SoldOutSection soldOut={summary.soldOut} />
                <SearchSection searches={summary.searches} />
                <BrowsingSection sorting={summary.sorting} pagination={summary.pagination} clicks={summary.clicks} topPages={summary.topPages} />
              </>
            )}
          </Box>
        ) : null}
      </Box>
    </Container>
  );
}
