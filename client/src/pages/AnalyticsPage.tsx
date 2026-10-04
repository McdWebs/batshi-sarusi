import { Alert, Box, Container, Typography } from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { buildInsights, type InsightTab } from "../analytics/advice";
import { parseDays, parseTab, rangeInfo, type AnalyticsTabId } from "../analytics/labels";
import { ApiError } from "../api/client";
import { getAnalyticsSummary } from "../api/store";
import { AccessCodeForm } from "../components/AccessCodeForm";
import { AnalyticsSkeleton } from "../components/analytics/AnalyticsSkeleton";
import { AnalyticsTabs, tabButtonId, tabPanelId } from "../components/analytics/AnalyticsTabs";
import { BuyingTab } from "../components/analytics/BuyingTab";
import { DailyChart } from "../components/analytics/DailyChart";
import { HealthTab } from "../components/analytics/HealthTab";
import { InsightsList } from "../components/analytics/InsightsList";
import { ProductsTab } from "../components/analytics/ProductsTab";
import { RangeSwitch } from "../components/analytics/RangeSwitch";
import { SearchesTab } from "../components/analytics/SearchesTab";
import { Block, detailGrid, focusRing, ink, visuallyHidden } from "../components/analytics/shared";
import { SummaryBlock } from "../components/analytics/SummaryBlock";
import { VisitorsTab } from "../components/analytics/VisitorsTab";
import { ErrorState } from "../components/States";
import { setStudioKey } from "../studio/studioKey";

const headerLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
  color: ink.accent,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
  ...focusRing,
} as const;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The friendly page when nobody has visited yet (or nobody accepted statistics cookies). */
function NoTraffic({ span }: { span: string }) {
  return (
    <Box component="section" aria-labelledby="analytics-empty" sx={{ mt: 6, py: { xs: 2, md: 4 } }}>
      <Typography id="analytics-empty" variant="h2" sx={{ fontSize: { xs: 22, md: 26 }, lineHeight: 1.3 }}>
        עדיין אין נתונים {span}
      </Typography>
      <Typography sx={{ mt: 1.5, fontSize: 16, lineHeight: 1.7, maxWidth: 560 }}>
        המספרים מופיעים אחרי שמבקרים באתר מאשרים עוגיות סטטיסטיקה. אם בחרתם תקופה קצרה, אפשר לנסות תקופה ארוכה יותר.
      </Typography>
      <Typography sx={{ mt: 3, mb: 1, color: ink.muted, fontSize: 14 }}>
        להדגמה אפשר לטעון נתוני דוגמה. מי שמפתח את האתר מריץ בשורת הפקודה:
      </Typography>
      <Box
        component="code"
        dir="ltr"
        sx={{ display: "block", width: "fit-content", maxWidth: "100%", overflowX: "auto", px: 2, py: 1.25, bgcolor: ink.track, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 14, userSelect: "all" }}
      >
        npm run analytics:seed-demo -w server
      </Box>
    </Box>
  );
}

export function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const days = parseDays(params.get("days"));
  const tab = parseTab(params.get("tab"));
  const range = rangeInfo(days);
  const detailsRef = useRef<HTMLDivElement>(null);
  /** Changing the URL makes the site's ScrollToTop jump to the top. Remember where we were and put it back. */
  const afterNavigation = useRef<{ y: number; toDetails: boolean } | null>(null);

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

  const scrollToDetails = useCallback(() => {
    detailsRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const search = params.toString();
  useEffect(() => {
    const pending = afterNavigation.current;
    if (!pending) return;
    afterNavigation.current = null;
    window.scrollTo(0, pending.y);
    if (pending.toDetails) scrollToDetails();
  }, [search, scrollToDetails]);

  const setParam = (key: "days" | "tab", value: string, toDetails = false) => {
    if (value === (key === "days" ? String(days) : tab)) return;
    afterNavigation.current = { y: window.scrollY, toDetails };
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        copy.set(key, value);
        return copy;
      },
      { replace: true },
    );
  };

  const openTab = (next: InsightTab) => {
    if (next === tab) {
      scrollToDetails();
      return;
    }
    setParam("tab", next, true);
  };

  const insights = summary ? buildInsights(summary) : [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: { md: "flex-end" }, justifyContent: "space-between", columnGap: 4, rowGap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: ink.accent }}>דמו פנימי</Typography>
          <Typography variant="h1" sx={{ mt: 0.5, fontSize: { xs: 36, md: 40 }, lineHeight: 1.2 }}>
            איך הולך באתר
          </Typography>
          <Typography sx={{ mt: 1, color: ink.muted, fontSize: 16, lineHeight: 1.6 }}>מה קורה באתר, ומה כדאי לבדוק.</Typography>
          <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", columnGap: 3 }}>
            <Typography component={RouterLink} to="/demand" sx={headerLinkSx}>
              ביקוש למוצרים שאזלו
            </Typography>
            <Typography component={RouterLink} to="/studio" sx={headerLinkSx}>
              סטודיו התוכן
            </Typography>
          </Box>
        </Box>
        <Box sx={{ marginInlineStart: { xs: -1.75, md: 0 } }}>
          <RangeSwitch days={days} onChange={(next) => setParam("days", String(next))} />
        </Box>
      </Box>

      <Box aria-busy={query.isFetching} sx={{ mt: 0 }}>
        {refreshing ? <Box role="status" sx={visuallyHidden}>מעדכן את המספרים</Box> : null}
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
          <Box sx={{ mt: 4 }}>
            <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
          </Box>
        ) : summary ? (
          <Box sx={{ opacity: refreshing ? 0.55 : 1, transition: "opacity 160ms", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
            {summary.hasDemoData ? (
              <Alert severity="info" sx={{ mt: 3, py: 0, alignItems: "center", fontSize: 14 }}>
                נתוני הדגמה: חלק מהנתונים נוצרו אוטומטית ואינם מבקרים אמיתיים
              </Alert>
            ) : null}

            {summary.kpis.sessions === 0 ? (
              <NoTraffic span={range.span} />
            ) : (
              <>
                <SummaryBlock summary={summary} />

                <Block title="מה כדאי לשים לב">
                  <InsightsList insights={insights} onOpen={openTab} />
                </Block>

                <Block title="כמה אנשים הגיעו כל יום">
                  <DailyChart daily={summary.daily} days={days} />
                </Block>

                <Box ref={detailsRef} sx={{ scrollMarginTop: 96 }}>
                  <Block title="עוד פרטים">
                    <AnalyticsTabs tab={tab} label="פרטים לפי נושא" onChange={(next: AnalyticsTabId) => setParam("tab", next)} />
                    <Box
                      role="tabpanel"
                      id={tabPanelId(tab)}
                      aria-labelledby={tabButtonId(tab)}
                      tabIndex={0}
                      sx={{ pt: 4, outline: "none", ...detailGrid, "&:focus-visible": { outline: `2px solid ${ink.accent}`, outlineOffset: 4 } }}
                    >
                      {tab === "visitors" ? <VisitorsTab summary={summary} /> : null}
                      {tab === "products" ? <ProductsTab summary={summary} /> : null}
                      {tab === "searches" ? <SearchesTab summary={summary} /> : null}
                      {tab === "buying" ? <BuyingTab summary={summary} /> : null}
                      {tab === "health" ? <HealthTab summary={summary} /> : null}
                    </Box>
                  </Block>
                </Box>
              </>
            )}
          </Box>
        ) : null}
      </Box>
    </Container>
  );
}
