import { useCallback } from "react";
import { AppBar, Badge, Box, IconButton, Link as MuiLink, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useLocation } from "react-router-dom";
import type { Category } from "../api/types";
import { useAllCategories } from "../hooks/useCatalog";
import { useCart } from "../hooks/useCart";
import { useUiStore } from "../store/ui";
import { collections, departments, storefrontHref } from "../storefront/map";
import { normalizePath } from "../utils/format";
import logo from "../assets/batshi-logo.png";
import { MobileNav } from "./MobileNav";

function pathIsActive(pathname: string, to: string) {
  const current = normalizePath(pathname);
  const target = normalizePath(to.split("#")[0] || to);
  if (!target) return current === "";
  if (target === "shop" || target === "sale") return current === target;
  return current === target || current.startsWith(`${target}/`);
}

function anyActive(pathname: string, categories: Category[]) {
  return categories.some((category) => pathIsActive(pathname, storefrontHref(category)));
}

export function AnnouncementBar() {
  return (
    <Box sx={{ bgcolor: "#2C241E", color: "#F7F1E8", py: 0.9, px: 2, textAlign: "center" }}>
      <Typography variant="body2">בית לאוהבי הבישול והאירוח · אספקה עד 14 ימי עסקים</Typography>
    </Box>
  );
}

function DoorLink({
  to,
  label,
  active,
  accent,
  onClick,
}: {
  to: string;
  label: string;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <MuiLink
      component={Link}
      to={to}
      onClick={onClick}
      underline="none"
      aria-current={active ? "page" : undefined}
      sx={{
        flexShrink: 0,
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        color: active || accent ? "secondary.main" : "text.primary",
        whiteSpace: "nowrap",
        px: 0.5,
        py: 1,
        borderBottom: "2px solid",
        borderColor: active ? "secondary.main" : "transparent",
        "&:hover": { color: "secondary.main" },
      }}
    >
      {label}
    </MuiLink>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const { data: categories = [] } = useAllCategories();
  const { data: cart } = useCart();
  const { cartOpen, setCartOpen, navOpen, setNavOpen } = useUiStore();
  const collectionItems = collections(categories);
  const departmentItems = departments(categories);
  const closeNav = useCallback(() => setNavOpen(false), [setNavOpen]);

  return (
    <>
      <AnnouncementBar />
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ gap: { xs: 1, md: 2 }, minHeight: { xs: 64, md: 72 } }}>
          <IconButton
            aria-label={navOpen ? "סגירת תפריט" : "תפריט"}
            aria-expanded={navOpen}
            aria-controls="mobile-nav-title"
            onClick={() => setNavOpen(!navOpen)}
            sx={{ display: { md: "none" } }}
          >
            {navOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
          <Box
            component={Link}
            to="/"
            aria-label="בתשי הום"
            sx={{ display: "flex", alignItems: "center", mr: { xs: "auto", md: 0 }, textDecoration: "none", lineHeight: 0, flexShrink: 0 }}
          >
            <Box
              component="img"
              src={logo}
              alt="בתשי הום"
              sx={{ height: { xs: 36, md: 44 }, width: "auto", display: "block" }}
            />
          </Box>
          <Box
            component="nav"
            aria-label="ניווט החנות"
            sx={{
              display: { xs: "none", md: "flex" },
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: { md: 2, lg: 3 },
              minWidth: 0,
            }}
          >
            <DoorLink to="/shop" label="הכל" active={pathIsActive(pathname, "/shop")} />
            <DoorLink to="/sale" label="מבצעים" active={pathIsActive(pathname, "/sale")} accent />
            <DoorLink
              to="/departments"
              label="מחלקות"
              active={pathIsActive(pathname, "/departments") || anyActive(pathname, departmentItems)}
            />
            <DoorLink
              to="/collections"
              label="קולקציות"
              active={pathIsActive(pathname, "/collections") || anyActive(pathname, collectionItems)}
            />
          </Box>
          <IconButton
            component={Link}
            to="/search"
            aria-label="חיפוש"
            aria-current={pathIsActive(pathname, "/search") ? "page" : undefined}
            sx={{ color: pathIsActive(pathname, "/search") ? "secondary.main" : "inherit" }}
          >
            <SearchIcon />
          </IconButton>
          <IconButton aria-label="עגלה" onClick={() => setCartOpen(!cartOpen)}>
            <Badge badgeContent={cart?.itemsCount ?? 0} color="secondary">
              <ShoppingBagOutlinedIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <MobileNav
        open={navOpen}
        onClose={closeNav}
        pathname={pathname}
        departments={departmentItems}
        collections={collectionItems}
      />
    </>
  );
}
