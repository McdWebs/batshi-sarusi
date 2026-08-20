import { Suspense } from "react";
import { Box, Skeleton } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CartDrawer } from "../components/CartDrawer";
import { CartNotice } from "../components/CartNotice";
import { ScrollToTop } from "../components/ScrollToTop";
import { AccessibilityRoot } from "../accessibility/AccessibilityRoot";
import { AccessibilityWidget } from "../accessibility/AccessibilityWidget";
import { CookieConsent } from "../consent/CookieConsent";

function RouteFallback() {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 5 }} aria-busy="true" aria-label="טוען עמוד">
      <Skeleton
        variant="rectangular"
        animation="wave"
        height={28}
        width={180}
        sx={{ mb: 2, bgcolor: "#EDE4D6", transform: "none" }}
      />
      <Skeleton
        variant="rectangular"
        animation="wave"
        height={40}
        width="40%"
        sx={{ mb: 3, bgcolor: "#EDE4D6", transform: "none" }}
      />
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            animation="wave"
            sx={{ aspectRatio: "1 / 1", width: "100%", height: "auto", bgcolor: "#EDE4D6", transform: "none" }}
          />
        ))}
      </Box>
    </Box>
  );
}

export function AppShell() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <a className="skip-link" href="#main-content">
        דלג לתוכן הראשי
      </a>
      <AccessibilityRoot />
      <ScrollToTop />
      <Header />
      <CartDrawer />
      <CartNotice />
      <Box id="main-content" component="main" tabIndex={-1} sx={{ flex: 1, outline: "none" }}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </Box>
      <Footer />
      <AccessibilityWidget />
      <CookieConsent />
    </Box>
  );
}
