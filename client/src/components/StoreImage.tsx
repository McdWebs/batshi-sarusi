import { Box, type BoxProps } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useA11yStore } from "../accessibility/store";
import { reportImageError } from "../analytics/tracker";
import { optimizeImage } from "../utils/imageProxy";

const PLACEHOLDER = "#EDE4D6";
const DECODE_GRACE_MS = 250;

/**
 * Shows a store photo without the browser's "printing" effect.
 *
 * The image stays invisible over a calm placeholder until it has fully loaded and been decoded, then
 * fades in as one piece, so nobody sees it painted line by line or blurry to sharp. The caller still
 * decides the size of the box (give the parent an aspect ratio so nothing jumps).
 */
export function StoreImage({
  src,
  alt,
  srcSet,
  sizes,
  loading = "lazy",
  priority = false,
  objectFit = "cover",
  mixBlendMode,
  ...props
}: {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  /** Above-the-fold photo: fetch it first and never lazy-load it. */
  priority?: boolean;
  objectFit?: "cover" | "contain";
  mixBlendMode?: CSSProperties["mixBlendMode"];
} & Omit<BoxProps, "component" | "src" | "alt">) {
  const showAlts = useA11yStore((state) => state.showAlts);
  const { sx, ...rest } = props;
  const imageRef = useRef<HTMLImageElement>(null);
  // Shop photos are served resized and recompressed by our own server. If that ever fails, the original is used.
  const [proxyFailed, setProxyFailed] = useState(false);
  const optimized = useMemo(() => (proxyFailed ? null : optimizeImage(src, srcSet)), [src, srcSet, proxyFailed]);
  const finalSrc = optimized?.src ?? src;
  const finalSrcSet = optimized?.srcSet ?? srcSet;
  // Tracking the loaded source (not a boolean) hides the old photo again when the source changes, e.g. in a gallery.
  const sourceKey = `${finalSrc}|${finalSrcSet ?? ""}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loaded = loadedKey === sourceKey;

  const reveal = useCallback(
    (image: HTMLImageElement) => {
      const show = () => setLoadedKey(sourceKey);
      // The "printing" look comes from bytes arriving slowly, and onLoad means they have all arrived. decode()
      // additionally does the pixel work off-screen, but browsers can leave it pending for off-screen lazy
      // photos, so it only gets a short window before the photo is shown anyway.
      if (typeof image.decode === "function") {
        const grace = new Promise<void>((resolve) => window.setTimeout(resolve, DECODE_GRACE_MS));
        void Promise.race([image.decode().catch(() => undefined), grace]).then(show);
      } else {
        show();
      }
    },
    [sourceKey],
  );

  // Photos served from the browser cache can be complete before React attaches onLoad.
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth > 0) reveal(image);
  }, [reveal]);

  return (
    <Box
      sx={{
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        bgcolor: loaded ? "transparent" : PLACEHOLDER,
        ...sx,
      }}
      {...rest}
    >
      <Box
        component="img"
        ref={imageRef}
        src={finalSrc}
        srcSet={finalSrcSet || undefined}
        sizes={sizes || undefined}
        alt={alt}
        loading={priority ? "eager" : loading}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={(event) => reveal(event.currentTarget)}
        onError={() => {
          if (optimized) {
            // The resizer failed: fall back to the original photo, and count it so a broken resizer shows up.
            reportImageError(finalSrc, true);
            setProxyFailed(true);
          } else {
            reportImageError(finalSrc);
          }
        }}
        sx={{
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 260ms ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          ...(mixBlendMode ? { mixBlendMode } : {}),
        }}
      />
      {showAlts && alt ? <span className="a11y-alt-caption">{alt}</span> : null}
    </Box>
  );
}
