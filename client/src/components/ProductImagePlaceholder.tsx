import { Box, type BoxProps } from "@mui/material";

/** Soft brand-matched stand-in when a product has no gallery image. */
export function ProductImagePlaceholder({
  label = "אין תמונה",
  ...props
}: { label?: string } & Omit<BoxProps, "children">) {
  const { sx, ...rest } = props;

  return (
    <Box
      role="img"
      aria-label={label}
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "#EDE4D6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(44, 36, 30, 0.28)",
        ...sx,
      }}
      {...rest}
    >
      <Box
        component="svg"
        viewBox="0 0 48 48"
        aria-hidden
        sx={{ width: "34%", maxWidth: 72, minWidth: 28, height: "auto", display: "block" }}
      >
        <rect x="6" y="10" width="36" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17" cy="20" r="3.25" fill="currentColor" />
        <path
          d="M8 32.5 17 24l7 6.5 5.5-5 10 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Box>
    </Box>
  );
}
