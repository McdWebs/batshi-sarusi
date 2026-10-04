import { Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { formatCount, productLabel } from "../../analytics/labels";
import type { AnalyticsSummary } from "../../api/types";
import { CsvButton, focusRing, Group, ink, NameRows, Quiet } from "./shared";

const productHref = (productId: number) => `/product/${productId}`;

export function ProductsTab({ summary }: { summary: AnalyticsSummary }) {
  const { topProducts, viewedNeverAdded, soldOut } = summary;
  return (
    <>
      <Group
        title="המוצרים הכי נצפים"
        action={
          <CsvButton
            filename="batshi-top-products.csv"
            headers={["קוד מוצר", "שם", "צפיות", "הוספות לעגלה"]}
            rows={topProducts.map((row) => [row.productId, productLabel(row.name, row.productId), row.views, row.adds])}
          />
        }
      >
        {topProducts.length === 0 ? (
          <Quiet>עדיין אין צפיות במוצרים.</Quiet>
        ) : (
          <NameRows
            items={topProducts.map((row) => ({
              key: String(row.productId),
              label: productLabel(row.name, row.productId),
              href: productHref(row.productId),
              stat: `${formatCount(row.views)} צפיות · ${formatCount(row.adds)} הוספות לעגלה`,
            }))}
          />
        )}
      </Group>

      <Group title="נצפו הרבה ולא נוספו לעגלה" hint="אנשים מסתכלים ולא לוקחים. כדאי לבדוק את התמונה, המחיר והתיאור.">
        {viewedNeverAdded.length === 0 ? (
          <Quiet>אין כרגע מוצרים כאלה.</Quiet>
        ) : (
          <NameRows
            items={viewedNeverAdded.map((row) => ({
              key: String(row.productId),
              label: productLabel(row.name, row.productId),
              href: productHref(row.productId),
              stat: `${formatCount(row.views)} צפיות`,
            }))}
          />
        )}
      </Group>

      <Group title="אזלו ומבקשים אותם" hint="מוצרים שאזלו מהמלאי ועדיין אנשים נכנסים אליהם, וכמה השאירו בקשה לעדכון כשיחזרו.">
        {soldOut.length === 0 ? (
          <Quiet>אין מוצרים שאזלו ונצפו.</Quiet>
        ) : (
          <NameRows
            items={soldOut.map((row) => ({
              key: String(row.productId),
              label: productLabel(row.name, row.productId),
              href: productHref(row.productId),
              stat: `${formatCount(row.views)} צפיות · ${formatCount(row.signups)} בקשות עדכון`,
            }))}
          />
        )}
        <Typography
          component={RouterLink}
          to="/demand"
          sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, mt: 0.5, color: ink.accent, fontSize: 14, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" }, ...focusRing }}
        >
          לרשימת הביקוש המלאה
        </Typography>
      </Group>
    </>
  );
}
