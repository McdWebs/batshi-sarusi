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
    <Box component="footer" sx={{ mt: 8, borderTop: "1px solid", borderColor: "divider", py: 6, bgcolor: "background.paper" }}>
      <Container maxWidth="lg" sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr 1fr" } }}>
        <Box>
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
                width: "100%",
                maxWidth: 280,
                height: "auto",
                transform: "translateX(-48px)",
              }}
            />
          </Box>
          <Typography color="text.secondary" maxWidth={360}>
            בית לאוהבי הבישול והאירוח.
          </Typography>
        </Box>
        <Box>
          <Typography fontWeight={700} mb={1.5}>
            <MuiLink component={Link} to="/collections" underline="hover" color="inherit">
              קולקציות
            </MuiLink>
          </Typography>
          {collectionItems.map((category) => (
            <MuiLink
              key={category.id}
              component={Link}
              to={storefrontHref(category)}
              display="block"
              color="text.secondary"
              underline="hover"
              mb={0.75}
            >
              {category.name}
            </MuiLink>
          ))}
        </Box>
        <Box>
          <Typography fontWeight={700} mb={1.5}>
            <MuiLink component={Link} to="/departments" underline="hover" color="inherit">
              מחלקות
            </MuiLink>
          </Typography>
          {departmentItems.map((category) => (
            <MuiLink
              key={category.id}
              component={Link}
              to={storefrontHref(category)}
              display="block"
              color="text.secondary"
              underline="hover"
              mb={0.75}
            >
              {category.name}
            </MuiLink>
          ))}
        </Box>
        <Box>
          <Typography fontWeight={700} mb={1.5}>
            מידע
          </Typography>
          <MuiLink component={Link} to="/צור-קשר" display="block" color="text.secondary" underline="hover" mb={0.75}>
            צור קשר
          </MuiLink>
          <MuiLink component={Link} to="/אודות" display="block" color="text.secondary" underline="hover" mb={0.75}>
            אודות
          </MuiLink>
          <MuiLink component={Link} to="/תקנון-אתר" display="block" color="text.secondary" underline="hover" mb={0.75}>
            תקנון אתר
          </MuiLink>
          <MuiLink component={Link} to="/מדיניות-פרטיות" display="block" color="text.secondary" underline="hover" mb={0.75}>
            מדיניות פרטיות
          </MuiLink>
          <MuiLink component={Link} to="/הצהרת-נגישות" display="block" color="text.secondary" underline="hover" mb={0.75}>
            הצהרת נגישות
          </MuiLink>
          <MuiLink href="https://www.instagram.com/batshi_sarosi" target="_blank" rel="noreferrer" display="block" color="text.secondary" underline="hover">
            אינסטגרם
          </MuiLink>
        </Box>
      </Container>
    </Box>
  );
}
