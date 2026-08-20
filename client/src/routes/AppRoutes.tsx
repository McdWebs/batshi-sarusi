import { lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { HomePage } from "../pages/HomePage";

const ShopPage = lazy(() => import("../pages/CatalogPages").then((m) => ({ default: m.ShopPage })));
const SalePage = lazy(() => import("../pages/CatalogPages").then((m) => ({ default: m.SalePage })));
const SearchPage = lazy(() => import("../pages/CatalogPages").then((m) => ({ default: m.SearchPage })));
const DepartmentsPage = lazy(() =>
  import("../pages/CatalogPages").then((m) => ({ default: m.DepartmentsPage })),
);
const CollectionsPage = lazy(() =>
  import("../pages/CatalogPages").then((m) => ({ default: m.CollectionsPage })),
);
const CategoryPage = lazy(() => import("../pages/CatalogPages").then((m) => ({ default: m.CategoryPage })));
const BrandPage = lazy(() => import("../pages/CatalogPages").then((m) => ({ default: m.BrandPage })));
const ProductPage = lazy(() => import("../pages/ProductPage").then((m) => ({ default: m.ProductPage })));
const CartPage = lazy(() => import("../pages/CartPage").then((m) => ({ default: m.CartPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const CmsPage = lazy(() => import("../pages/InfoPages").then((m) => ({ default: m.CmsPage })));
const AccountPage = lazy(() => import("../pages/InfoPages").then((m) => ({ default: m.AccountPage })));
const CheckoutPage = lazy(() =>
  import("../pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })),
);
const NotFoundPage = lazy(() => import("../pages/InfoPages").then((m) => ({ default: m.NotFoundPage })));

function CategorySplat() {
  const splat = useParams()["*"] ?? "";
  return <CategoryPage splat={splat} />;
}

function BrandSlug() {
  const { slug } = useParams();
  return <BrandPage slug={slug ?? ""} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/sale" element={<SalePage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/product-category/*" element={<CategorySplat />} />
        <Route path="/brand/:slug" element={<BrandSlug />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/my-account" element={<AccountPage />} />
        <Route path="/צור-קשר" element={<ContactPage />} />
        <Route path="/login" element={<Navigate to="/my-account" replace />} />
        <Route path="/:slug" element={<CmsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
