import { Box, Container, Link as MuiLink, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useAllCategories } from "../hooks/useCatalog";
import { collections, departments, storefrontHref } from "../storefront/map";
import logo from "../assets/batshi-logo.png";

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
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography fontWeight={700} mb={1.5}>
            <MuiLink component={Link} to="/collections" underline="hover" color="inherit">
              קולקציות
            </MuiLink>
          </Typography>
          {collectionItems.map((category) => (
            <FooterLink key={category.id} to={storefrontHref(category)}>
              {category.name}
            </FooterLink>
          ))}
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography fontWeight={700} mb={1.5}>
            <MuiLink component={Link} to="/departments" underline="hover" color="inherit">
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
              rowGap: { xs: 0.75, md: 0 },
            }}
          >
            <Box sx={{ display: { xs: "contents", md: "none" } }}>
              <FooterLink to="/collections">קולקציות</FooterLink>
              <FooterLink to="/departments">מחלקות</FooterLink>
            </Box>
            <FooterLink to="/צור-קשר">צור קשר</FooterLink>
            <FooterLink to="/אודות">אודות</FooterLink>
            <FooterLink to="/תקנון-אתר">תקנון אתר</FooterLink>
            <FooterLink to="/מדיניות-פרטיות">מדיניות פרטיות</FooterLink>
            <FooterLink to="/הצהרת-נגישות">הצהרת נגישות</FooterLink>
            <MuiLink
              href="https://www.instagram.com/batshi_sarosi"
              target="_blank"
              rel="noreferrer"
              display="block"
              color="text.secondary"
              underline="always"
              mb={{ xs: 0, md: 0.75 }}
              sx={{ fontSize: { xs: 14, md: 16 } }}
            >
              אינסטגרם
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <MuiLink
      component={Link}
      to={to}
      display="block"
      color="text.secondary"
      underline="always"
      mb={{ xs: 0, md: 0.75 }}
      sx={{ fontSize: { xs: 14, md: 16 } }}
    >
      {children}
    </MuiLink>
  );
}
