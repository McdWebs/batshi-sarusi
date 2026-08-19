import { forwardRef, useEffect, useState, type ReactElement, type Ref } from "react";
import {
  Box,
  Collapse,
  Dialog,
  IconButton,
  Link as MuiLink,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { Link } from "react-router-dom";
import type { Category } from "../api/types";
import { storefrontHref } from "../storefront/map";
import { normalizePath } from "../utils/format";
import logo from "../assets/batshi-logo.png";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

function pathIsActive(pathname: string, to: string) {
  const current = normalizePath(pathname);
  const target = normalizePath(to.split("#")[0] || to);
  if (!target) return current === "";
  if (target === "shop" || target === "sale") return current === target;
  return current === target || current.startsWith(`${target}/`);
}

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  pathname: string;
  departments: Category[];
  collections: Category[];
};

export function MobileNav({ open, onClose, pathname, departments, collections }: MobileNavProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [openSection, setOpenSection] = useState<"departments" | "collections" | null>(null);

  useEffect(() => {
    if (!open) {
      setOpenSection(null);
      return;
    }
    if (departments.some((category) => pathIsActive(pathname, storefrontHref(category)))) {
      setOpenSection("departments");
    } else if (collections.some((category) => pathIsActive(pathname, storefrontHref(category)))) {
      setOpenSection("collections");
    }
  }, [open, pathname, departments, collections]);

  useEffect(() => {
    if (isDesktop && open) onClose();
  }, [isDesktop, open, onClose]);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      aria-labelledby="mobile-nav-title"
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box component={Link} to="/" onClick={onClose} aria-label="בתשי הום" sx={{ lineHeight: 0 }}>
          <Box component="img" src={logo} alt="" sx={{ height: 36, width: "auto", display: "block" }} />
        </Box>
        <IconButton aria-label="סגירת תפריט" onClick={onClose} size="large">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        component="nav"
        aria-label="ניווט החנות"
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          py: 3,
          pb: "max(32px, env(safe-area-inset-bottom))",
          "@keyframes menuIn": {
            from: { opacity: 0, transform: "translateY(12px)" },
            to: { opacity: 1, transform: "none" },
          },
          "& > *": {
            animation: "menuIn 420ms ease both",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
          "& > :nth-of-type(1)": { animationDelay: "40ms" },
          "& > :nth-of-type(2)": { animationDelay: "80ms" },
          "& > :nth-of-type(3)": { animationDelay: "120ms" },
          "& > :nth-of-type(4)": { animationDelay: "160ms" },
          "& > :nth-of-type(5)": { animationDelay: "200ms" },
          "& > :nth-of-type(6)": { animationDelay: "240ms" },
          "& > :nth-of-type(7)": { animationDelay: "280ms" },
        }}
      >
        <Typography id="mobile-nav-title" variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.18em", display: "block", mb: 1 }}>
          תפריט
        </Typography>
        <Typography sx={{ fontFamily: '"Noto Serif Hebrew", serif', fontSize: 18, color: "text.secondary", mb: 4 }}>
          בית לאוהבי הבישול והאירוח
        </Typography>

        <NavRow index="01" to="/shop" label="הכל" active={pathIsActive(pathname, "/shop")} onClick={onClose} />
        <NavRow index="02" to="/sale" label="מבצעים" active={pathIsActive(pathname, "/sale")} accent onClick={onClose} />
        <NavSection
          index="03"
          label="מחלקות"
          hubTo="/departments"
          expanded={openSection === "departments"}
          onToggle={() => setOpenSection((current) => (current === "departments" ? null : "departments"))}
          active={pathIsActive(pathname, "/departments") || departments.some((category) => pathIsActive(pathname, storefrontHref(category)))}
          items={departments}
          onClose={onClose}
          pathname={pathname}
        />
        <NavSection
          index="04"
          label="קולקציות"
          hubTo="/collections"
          expanded={openSection === "collections"}
          onToggle={() => setOpenSection((current) => (current === "collections" ? null : "collections"))}
          active={pathIsActive(pathname, "/collections") || collections.some((category) => pathIsActive(pathname, storefrontHref(category)))}
          items={collections}
          onClose={onClose}
          pathname={pathname}
        />

        <Box sx={{ mt: 5, pt: 3, borderTop: "1px solid", borderColor: "divider", display: "grid", gap: 1.5 }}>
          <MuiLink
            component={Link}
            to="/search"
            onClick={onClose}
            underline="none"
            sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.primary", fontWeight: 600, width: "fit-content" }}
          >
            <SearchIcon fontSize="small" />
            חיפוש
          </MuiLink>
          <FooterLink to="/צור-קשר" onClick={onClose}>
            צור קשר
          </FooterLink>
          <FooterLink to="/אודות" onClick={onClose}>
            אודות
          </FooterLink>
          <MuiLink
            href="https://www.instagram.com/batshi_sarosi"
            target="_blank"
            rel="noreferrer"
            underline="none"
            sx={{ color: "text.secondary", width: "fit-content" }}
          >
            אינסטגרם
          </MuiLink>
        </Box>
      </Box>
    </Dialog>
  );
}

function NavRow({
  index,
  to,
  label,
  active,
  accent,
  onClick,
}: {
  index: string;
  to: string;
  label: string;
  active?: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <MuiLink
      component={Link}
      to={to}
      onClick={onClick}
      underline="none"
      aria-current={active ? "page" : undefined}
      sx={{
        display: "grid",
        gridTemplateColumns: "40px 1fr",
        alignItems: "baseline",
        py: 1.75,
        borderBottom: "1px solid",
        borderColor: "divider",
        color: accent || active ? "secondary.main" : "text.primary",
      }}
    >
      <Typography component="span" sx={{ fontSize: 12, letterSpacing: "0.12em", color: "text.secondary" }}>
        {index}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: '"Noto Serif Hebrew", serif',
          fontSize: { xs: 32, sm: 36 },
          fontWeight: 600,
          lineHeight: 1.15,
        }}
      >
        {label}
      </Typography>
    </MuiLink>
  );
}

function NavSection({
  index,
  label,
  hubTo,
  expanded,
  onToggle,
  active,
  items,
  onClose,
  pathname,
}: {
  index: string;
  label: string;
  hubTo: string;
  expanded: boolean;
  onToggle: () => void;
  active?: boolean;
  items: Category[];
  onClose: () => void;
  pathname: string;
}) {
  const panelId = `mobile-nav-${index}`;

  return (
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "40px 1fr auto", alignItems: "center", py: 1.25 }}>
        <Typography component="span" sx={{ fontSize: 12, letterSpacing: "0.12em", color: "text.secondary" }}>
          {index}
        </Typography>
        <MuiLink
          component={Link}
          to={hubTo}
          onClick={onClose}
          underline="none"
          aria-current={active ? "page" : undefined}
          sx={{ color: active ? "secondary.main" : "text.primary" }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: '"Noto Serif Hebrew", serif',
              fontSize: { xs: 32, sm: 36 },
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
            {label}
          </Typography>
        </MuiLink>
        <IconButton
          aria-label={expanded ? `סגירת ${label}` : `פתיחת ${label}`}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          sx={{
            color: "text.primary",
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 200ms ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <Collapse in={expanded} id={panelId}>
        <Box sx={{ display: "grid", gap: 0.5, pb: 2.5, pr: { xs: 0, sm: 1 } }}>
          {items.map((category) => {
            const to = storefrontHref(category);
            const current = pathIsActive(pathname, to);
            return (
              <MuiLink
                key={category.id}
                component={Link}
                to={to}
                onClick={onClose}
                underline="none"
                aria-current={current ? "page" : undefined}
                sx={{
                  display: "block",
                  py: 0.85,
                  color: current ? "secondary.main" : "text.secondary",
                  fontWeight: current ? 700 : 500,
                  "&:hover": { color: "secondary.main" },
                }}
              >
                {category.name}
              </MuiLink>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

function FooterLink({ to, onClick, children }: { to: string; onClick: () => void; children: string }) {
  return (
    <MuiLink component={Link} to={to} onClick={onClick} underline="none" sx={{ color: "text.secondary", width: "fit-content" }}>
      {children}
    </MuiLink>
  );
}
