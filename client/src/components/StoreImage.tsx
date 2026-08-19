import { Box, type BoxProps } from "@mui/material";
import type { CSSProperties } from "react";
import { useA11yStore } from "../accessibility/store";

export function StoreImage({
  src,
  alt,
  loading = "lazy",
  objectFit = "cover",
  mixBlendMode,
  ...props
}: {
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
  objectFit?: "cover" | "contain";
  mixBlendMode?: CSSProperties["mixBlendMode"];
} & Omit<BoxProps, "component" | "src" | "alt">) {
  const showAlts = useA11yStore((state) => state.showAlts);
  const { sx, ...rest } = props;

  return (
    <Box sx={{ position: "relative", display: "block", width: "100%", height: "100%", ...sx }} {...rest}>
      <Box
        component="img"
        src={src}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        sx={{
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
          ...(mixBlendMode ? { mixBlendMode } : {}),
        }}
      />
      {showAlts && alt ? <span className="a11y-alt-caption">{alt}</span> : null}
    </Box>
  );
}

