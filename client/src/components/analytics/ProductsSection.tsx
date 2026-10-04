import { Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { AnalyticsSummary } from "../../api/types";
import { formatCount, productLabel } from "../../analytics/labels";
import { CsvButton, EmptyNote, RankedRows, Section, SubSection, TwoColumns } from "./shared";

const productHref = (productId: number) => `/product/${productId}`;

export function ProductsSection({ topProducts, viewedNeverAdded }: Pick<AnalyticsSummary, "topProducts" | "viewedNeverAdded">) {
  return (
    <Section title="מוצרים" intro="אילו מוצרים אנשים פותחים, ואילו הם מוסיפים לעגלה.">
      <TwoColumns>
        <SubSection
          title="המוצרים הכי נצפים"
          hint="צפיות הן פתיחות של דף המוצר. הוספות לעגלה כוללות גם הוספה מהירה מכרטיס המוצר."
          action={
            <CsvButton
              filename="batshi-top-products.csv"
              headers={["קוד מוצר", "שם", "צפיות", "הוספות לעגלה"]}
              rows={topProducts.map((row) => [row.productId, productLabel(row.name, row.productId), row.views, row.adds])}
            />
          }
        >
          {topProducts.length === 0 ? (
            <EmptyNote>עדיין אין צפיות במוצרים בטווח הזה.</EmptyNote>
          ) : (
            <RankedRows
              rows={topProducts.map((row) => ({
                key: String(row.productId),
                label: productLabel(row.name, row.productId),
                href: productHref(row.productId),
                stats: [
                  { value: formatCount(row.views), caption: "צפיות" },
                  { value: formatCount(row.adds), caption: "הוספות" },
                ],
              }))}
            />
          )}
        </SubSection>

        <SubSection
          title="נצפו הרבה ולא נוספו לעגלה"
          hint="אנשים מסתכלים ולא לוקחים. כדאי לבדוק אם התמונות, המחיר או התיאור של המוצר צריכים שיפור."
        >
          {viewedNeverAdded.length === 0 ? (
            <EmptyNote>אין כרגע מוצרים כאלה. כל מוצר שנצפה הרבה נוסף לעגלה לפחות פעם אחת.</EmptyNote>
          ) : (
            <RankedRows
              rows={viewedNeverAdded.map((row) => ({
                key: String(row.productId),
                label: productLabel(row.name, row.productId),
                href: productHref(row.productId),
                stats: [{ value: formatCount(row.views), caption: "צפיות" }],
              }))}
            />
          )}
        </SubSection>
      </TwoColumns>
    </Section>
  );
}

export function SoldOutSection({ soldOut }: Pick<AnalyticsSummary, "soldOut">) {
  return (
    <Section
      title="מוצרים שאזלו ומבקשים אותם"
      intro={
        <>
          מוצרים שאזלו מהמלאי ועדיין אנשים נכנסים אליהם, וכמה השאירו בקשה לעדכון כשהם יחזרו.{" "}
          <Typography component={RouterLink} to="/demand" sx={{ color: "secondary.main", fontSize: "inherit", fontWeight: 600 }}>
            לרשימה המלאה של הביקוש
          </Typography>
        </>
      }
    >
      {soldOut.length === 0 ? (
        <EmptyNote>אין מוצרים שאזלו ונצפו בטווח הזה.</EmptyNote>
      ) : (
        <RankedRows
          rows={soldOut.map((row) => ({
            key: String(row.productId),
            label: productLabel(row.name, row.productId),
            href: productHref(row.productId),
            stats: [
              { value: formatCount(row.views), caption: "צפיות" },
              { value: formatCount(row.signups), caption: "בקשות עדכון" },
            ],
          }))}
        />
      )}
    </Section>
  );
}
