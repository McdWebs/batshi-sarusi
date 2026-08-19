import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: { main: "#2C241E", contrastText: "#F7F1E8" },
    secondary: { main: "#8F3D2A" },
    background: { default: "#F4EEE4", paper: "#FFFbf5" },
    text: { primary: "#1C1814", secondary: "#6A6158" },
    divider: "rgba(44, 36, 30, 0.12)",
  },
  typography: {
    fontFamily: '"Heebo", "Arial", sans-serif',
    h1: { fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif', fontWeight: 600, letterSpacing: "-0.02em" },
    h2: { fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif', fontWeight: 600 },
    h3: { fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif', fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 2, paddingInline: 20, paddingBlock: 10 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#F4EEE4", color: "#1C1814" },
        img: { maxWidth: "100%" },
      },
    },
  },
});
