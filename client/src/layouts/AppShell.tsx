import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CartDrawer } from "../components/CartDrawer";
import { CartNotice } from "../components/CartNotice";
import { ScrollToTop } from "../components/ScrollToTop";
import { AccessibilityRoot } from "../accessibility/AccessibilityRoot";
import { AccessibilityWidget } from "../accessibility/AccessibilityWidget";

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
        <Outlet />
      </Box>
      <Footer />
      <AccessibilityWidget />
    </Box>
  );
}
