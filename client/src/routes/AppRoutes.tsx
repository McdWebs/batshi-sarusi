import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { HomePage } from "../pages/HomePage";
import { BrandPage, CategoryPage, CollectionsPage, DepartmentsPage, SalePage, SearchPage, ShopPage } from "../pages/CatalogPages";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { AccountPage, CheckoutBlockedPage, CmsPage, NotFoundPage } from "../pages/InfoPages";

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
        <Route path="/checkout" element={<CheckoutBlockedPage />} />
        <Route path="/my-account" element={<AccountPage />} />
        <Route path="/login" element={<Navigate to="/my-account" replace />} />
        <Route path="/:slug" element={<CmsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
