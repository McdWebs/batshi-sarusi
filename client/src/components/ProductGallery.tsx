import { Box } from "@mui/material";
import { useState } from "react";
import type { Image } from "../api/types";
import { StoreImage } from "./StoreImage";

export function ProductGallery({ images, name }: { images: Image[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  if (!current) {
    return <Box sx={{ aspectRatio: "1 / 1", bgcolor: "#EDE4D6" }} />;
  }

  return (
    <Box>
      <Box sx={{ aspectRatio: "1 / 1", bgcolor: "#EDE4D6", mb: 1.5, overflow: "hidden" }}>
        <StoreImage
          src={current.src}
          alt={current.alt || name}
          loading="eager"
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>
      {images.length > 1 ? (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto" }}>
          {images.map((image, imageIndex) => (
            <Box
              key={image.id || imageIndex}
              component="button"
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`תמונה ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              sx={{
                width: 72,
                height: 72,
                p: 0,
                border: imageIndex === index ? "2px solid #2C241E" : "1px solid rgba(44,36,30,0.2)",
                cursor: "pointer",
                bgcolor: "transparent",
              }}
            >
              <StoreImage src={image.thumbnail || image.src} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
