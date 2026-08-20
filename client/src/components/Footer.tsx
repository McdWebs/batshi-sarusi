import { Box, Container, Link as MuiLink, Typography } from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Link } from "react-router-dom";
import { useAllCategories } from "../hooks/useCatalog";
import { collections, departments, storefrontHref } from "../storefront/map";
import logo from "../assets/batshi-logo.png";

const footerLinkMotionSx = {
  transition: "color 180ms ease, transform 180ms ease",
  "@media (prefers-reduced-motion: reduce)": {
    transition: "color 180ms ease",
  },
  "&:hover": {
    color: "secondary.main",
    transform: "translateX(-4px)",
  },
};

export function Footer() {
  const { data: categories = [] } = useAllCategories();
  const collectionItems = collections(categories);
  const departmentItems = departments(categories);

  return (
    <Box
      component="footer"
      sx={{
        mt: { xs: 4, md: 8 },
        borderTop: "1px solid",
        borderColor: "divider",
        py: { xs: 3, md: 6 },
        bgcolor: "background.paper",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "grid",
          gap: { xs: 2.5, md: 4 },
          gridTemplateColumns: { xs: "1fr 1fr", md: "1.4fr 1fr 1fr 1fr" },
        }}
      >
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
          <Box
            component={Link}
            to="/"
            aria-label="בתשי הום"
            sx={{ display: "inline-flex", mb: 1, textDecoration: "none", lineHeight: 0 }}
          >
            <Box
              component="img"
              src={logo}
              alt="בתשי הום"
              sx={{
                display: "block",
                width: "auto",
                height: { xs: 40, md: "auto" },
                maxWidth: { xs: 160, md: 280 },
                transform: { xs: "none", md: "translateX(-48px)" },
              }}
            />
          </Box>
          <Typography color="text.secondary" maxWidth={360} sx={{ fontSize: { xs: 14, md: 16 } }}>
            בית לאוהבי הבישול והאירוח.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
            <MuiLink
              href="https://www.instagram.com/batshi_sarosi"
              target="_blank"
              rel="noreferrer"
              underline="none"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
                fontSize: { xs: 14, md: 16 },
                width: "fit-content",
                ...footerLinkMotionSx,
              }}
            >
              Instagram
              <InstagramIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
            </MuiLink>
          </Box>
        </Box>
        <Box sx={{ display: { xs: "none", md: "grid" }, gap: 0.75, alignContent: "start", minWidth: 0 }}>
          <Typography fontWeight={700} mb={0.75}>
            <MuiLink
              component={Link}
              to="/collections"
              underline="none"
              color="inherit"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, ...footerLinkMotionSx }}
            >
              <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", flexShrink: 0 }} />
              קולקציות
            </MuiLink>
          </Typography>
          {collectionItems.map((category) => (
            <FooterLink key={category.id} to={storefrontHref(category)}>
              {category.name}
            </FooterLink>
          ))}
        </Box>
        <Box sx={{ display: { xs: "none", md: "grid" }, gap: 0.75, alignContent: "start", minWidth: 0 }}>
          <Typography fontWeight={700} mb={0.75}>
            <MuiLink
              component={Link}
              to="/departments"
              underline="none"
              color="inherit"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, ...footerLinkMotionSx }}
            >
              <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", flexShrink: 0 }} />
              מחלקות
            </MuiLink>
          </Typography>
          {departmentItems.map((category) => (
            <FooterLink key={category.id} to={storefrontHref(category)}>
              {category.name}
            </FooterLink>
          ))}
        </Box>
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
          <Typography fontWeight={700} mb={1} sx={{ display: { xs: "none", md: "block" } }}>
            מידע
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "1fr" },
              columnGap: 2,
              rowGap: 0.75,
              alignContent: "start",
              minWidth: 0,
            }}
          >
            <Box sx={{ display: { xs: "contents", md: "none" } }}>
              <FooterLink to="/collections" featured>
                קולקציות
              </FooterLink>
              <FooterLink to="/departments" featured>
                מחלקות
              </FooterLink>
            </Box>
            <FooterLink to="/צור-קשר">צור קשר</FooterLink>
            <FooterLink to="/אודות">אודות</FooterLink>
            <FooterLink to="/תקנון-אתר">תקנון אתר</FooterLink>
            <FooterLink to="/מדיניות-פרטיות">מדיניות פרטיות</FooterLink>
            <FooterLink to="/הצהרת-נגישות">הצהרת נגישות</FooterLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function FooterLink({ to, children, featured = false }: { to: string; children: string; featured?: boolean }) {
  return (
    <MuiLink
      component={Link}
      to={to}
      color={featured ? "text.primary" : "text.secondary"}
      underline="none"
      sx={{
        fontSize: { xs: 14, md: 15 },
        fontWeight: featured ? 700 : 400,
        display: "flex",
        alignItems: "flex-start",
        gap: featured ? 0.75 : 0,
        maxWidth: "100%",
        lineHeight: 1.45,
        overflowWrap: "anywhere",
        ...footerLinkMotionSx,
      }}
    >
      {featured ? (
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", flexShrink: 0, mt: "0.45em" }} />
      ) : null}
      {children}
    </MuiLink>
  );
}
