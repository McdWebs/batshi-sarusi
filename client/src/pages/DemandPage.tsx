import { Box, Container, Skeleton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ApiError } from "../api/client";
import { getDemandRanking } from "../api/store";
import type { DemandRow } from "../api/types";
import { AccessCodeForm } from "../components/AccessCodeForm";
import { EmptyState, ErrorState } from "../components/States";
import { StoreImage } from "../components/StoreImage";
import { setStudioKey } from "../studio/studioKey";
import { productPath } from "../utils/format";

const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function Row({ row, rank, max }: { row: DemandRow; rank: number; max: number }) {
  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "28px 56px minmax(0, 1fr) auto", md: "36px 64px minmax(0, 1fr) 220px auto" },
        alignItems: "center",
        gap: { xs: 1.5, md: 2 },
        py: 1.5,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography sx={{ fontWeight: 700, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{rank}</Typography>
      <Box sx={{ width: { xs: 56, md: 64 }, aspectRatio: "1 / 1", bgcolor: "#EDE4D6", overflow: "hidden" }}>
        {row.image ? <StoreImage src={row.image} alt="" /> : null}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component={RouterLink}
          to={productPath(row.slug)}
          sx={{
            color: "inherit",
            textDecoration: "none",
            fontWeight: 500,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {row.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>בקשה אחרונה: {formatDate(row.lastSignupAt)}</Typography>
      </Box>
      <Box sx={{ display: { xs: "none", md: "block" }, height: 8, bgcolor: "#E7DFD2" }} aria-hidden="true">
        <Box sx={{ height: "100%", width: `${Math.max(6, (row.count / max) * 100)}%`, bgcolor: "secondary.main" }} />
      </Box>
      <Box sx={{ textAlign: "end" }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{row.count}</Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>מחכים</Typography>
      </Box>
    </Box>
  );
}

export function DemandPage() {
  const query = useQuery({
    queryKey: ["studio", "demand"],
    queryFn: getDemandRanking,
    staleTime: 0,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
  });
  const [codeTried, setCodeTried] = useState(false);
  const needsCode = query.error instanceof ApiError && query.error.status === 401;
  const items = query.data?.items ?? [];
  const max = Math.max(1, ...items.map((row) => row.count));
  const total = items.reduce((sum, row) => sum + row.count, 0);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "secondary.main", mb: 0.5 }}>דמו פנימי</Typography>
      <Typography variant="h3" sx={{ fontSize: { xs: 26, md: 34 }, lineHeight: 1.2 }}>
        ביקוש למוצרים שאזלו
      </Typography>
      <Typography sx={{ mt: 1, mb: 3, color: "text.secondary", fontSize: 14, maxWidth: 560 }}>
        כמה אנשים ביקשו עדכון כשהמוצר יחזור. מי שבראש הרשימה הכי מבוקש, ושם כדאי להזמין מלאי קודם. כתובות המייל לא מוצגות כאן.{" "}
        <RouterLink to="/studio">← לסטודיו</RouterLink>
      </Typography>

      {query.isLoading ? (
        <Box sx={{ display: "grid", gap: 1.5 }} aria-busy="true" aria-label="טוען">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="rectangular" animation="wave" height={64} sx={bone} />
          ))}
        </Box>
      ) : needsCode ? (
        <AccessCodeForm
          wrong={codeTried}
          onSubmit={(code) => {
            setStudioKey(code);
            setCodeTried(true);
            void query.refetch();
          }}
        />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="עדיין אין נרשמים." body="פתחו דף של מוצר שאזל מהמלאי ובקשו עדכון, והוא יופיע כאן." />
      ) : (
        <>
          <Typography sx={{ mb: 1, fontSize: 13, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
            {total === 1 ? "בקשה אחת" : `${total} בקשות`} על {items.length === 1 ? "מוצר אחד" : `${items.length} מוצרים`}
          </Typography>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, borderBottom: "1px solid", borderColor: "divider" }}>
            {items.map((row, index) => (
              <Row key={row.productId} row={row} rank={index + 1} max={max} />
            ))}
          </Box>
          <Typography sx={{ mt: 2, fontSize: 12, color: "text.secondary" }}>
            מצב הדגמה: הנתונים נשמרים בקובץ בשרת. אין עדיין שליחת מיילים, והרשימה לא מתעדכנת כשהמוצר חוזר למלאי.
          </Typography>
        </>
      )}
    </Container>
  );
}
