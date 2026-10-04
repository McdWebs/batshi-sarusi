import { Box, Button, Link as MuiLink, Popover, Skeleton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProduct } from "../api/store";
import type { Product } from "../api/types";
import type { Hotspot, Look, ProductRef } from "../content/looks";
import { findInfluencer } from "../content/influencers";
import { useCartMutations } from "../hooks/useCart";
import { decodeHtmlEntities, productPath } from "../utils/format";
import { ErrorState } from "./States";
import { Price } from "./Price";
import { StoreImage } from "./StoreImage";

function useLookProducts(look: Look) {
  const refs = useMemo(() => {
    const unique = new Map<string, ProductRef>();
    for (const ref of [look.imageProduct, ...look.hotspots.map((spot) => spot.product)]) unique.set(String(ref), ref);
    return [...unique.values()];
  }, [look]);

  const results = useQueries({
    queries: refs.map((ref) => ({
      queryKey: ["product", String(ref)],
      queryFn: () => getProduct(String(ref)),
      staleTime: 60_000,
    })),
  });

  const byRef = new Map<string, Product>();
  refs.forEach((ref, index) => {
    const data = results[index]?.data;
    if (data) byRef.set(String(ref), data);
  });

  return {
    byRef,
    pending: results.some((result) => result.isPending),
    imageProduct: byRef.get(String(look.imageProduct)),
    imageError: results[refs.indexOf(look.imageProduct)]?.isError ?? false,
    refetch: () => results.forEach((result) => void result.refetch()),
  };
}

export function LookCardSkeleton() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ width: "100%", height: "auto", aspectRatio: "3 / 4", bgcolor: "#EDE4D6", transform: "none" }}
      />
      <Skeleton variant="text" animation="wave" sx={{ mt: 1.5, width: "80%", height: 24, bgcolor: "#EDE4D6", transform: "none" }} />
      <Skeleton variant="text" animation="wave" sx={{ width: "45%", height: 20, bgcolor: "#EDE4D6", transform: "none" }} />
    </Box>
  );
}

function HotspotCard({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCartMutations();
  const canQuickAdd = Boolean(product.isPurchasable && product.isInStock && !product.hasOptions);
  const image = product.images[0];
  const path = productPath(product.slug);
  const name = decodeHtmlEntities(product.name);

  return (
    <Box sx={{ width: 264, maxWidth: "calc(100vw - 48px)", p: 1.5 }}>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <MuiLink
          component={Link}
          to={path}
          onClick={onClose}
          aria-hidden={!image ? true : undefined}
          tabIndex={-1}
          sx={{ flex: "0 0 72px", width: 72, height: 72, bgcolor: "#EDE4D6", overflow: "hidden", display: "block" }}
        >
          {image ? <StoreImage src={image.thumbnail || image.src} alt="" sx={{ width: 72, height: 72 }} /> : null}
        </MuiLink>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component={Link}
            to={path}
            onClick={onClose}
            variant="subtitle2"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600,
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 0.5,
            }}
          >
            {name}
          </Typography>
          <Price prices={product.prices} size="sm" />
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
        {product.isInStock ? (
          canQuickAdd ? (
            <Button
              fullWidth
              size="small"
              variant="contained"
              disabled={addItem.isPending}
              onClick={() => addItem.mutate({ id: product.id, quantity: product.addToCart.minimum || 1 })}
            >
              {addItem.isPending ? "מוסיפים…" : "הוספה לסל"}
            </Button>
          ) : (
            <Button fullWidth size="small" variant="contained" component={Link} to={path} onClick={onClose}>
              {product.hasOptions ? "בחירת אפשרות" : "לעמוד המוצר"}
            </Button>
          )
        ) : (
          <Button fullWidth size="small" variant="contained" disabled>
            {product.stockAvailability.text || "אזל מהמלאי"}
          </Button>
        )}
        <Button size="small" variant="outlined" component={Link} to={path} onClick={onClose} sx={{ whiteSpace: "nowrap" }}>
          לעמוד המוצר
        </Button>
      </Box>
    </Box>
  );
}

function Pin({
  spot,
  product,
  active,
  onOpen,
}: {
  spot: Hotspot;
  product: Product;
  active: boolean;
  onOpen: (anchor: HTMLElement) => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      data-track="look:pin"
      onClick={(event) => onOpen(event.currentTarget)}
      aria-label={`${spot.area}: ${decodeHtmlEntities(product.name)}. הצגת פרטי המוצר`}
      aria-haspopup="dialog"
      aria-expanded={active}
      sx={{
        position: "absolute",
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        transform: "translate(-50%, -50%)",
        width: 44,
        height: 44,
        p: 0,
        border: 0,
        bgcolor: "transparent",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        "& .pin-dot": {
          width: 26,
          height: 26,
          borderRadius: "50%",
          bgcolor: "secondary.main",
          color: "common.white",
          border: "2px solid #fff",
          boxShadow: "0 2px 8px rgba(28,24,20,0.45)",
          display: "grid",
          placeItems: "center",
          transition: "transform 0.15s ease",
        },
        "&:hover .pin-dot, &:focus-visible .pin-dot": { transform: "scale(1.15)" },
        "&:focus-visible": { outline: "3px solid #2C241E", outlineOffset: -4, borderRadius: "50%" },
        "@media (prefers-reduced-motion: no-preference)": {
          "& .pin-dot::after": {
            content: '""',
            position: "absolute",
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "2px solid #fff",
            animation: "pin-pulse 2.4s ease-out infinite",
            pointerEvents: "none",
          },
        },
        "@keyframes pin-pulse": {
          "0%": { transform: "scale(1)", opacity: 0.8 },
          "100%": { transform: "scale(1.9)", opacity: 0 },
        },
      }}
    >
      <span className="pin-dot" aria-hidden="true">
        <AddIcon sx={{ fontSize: 16 }} />
      </span>
    </Box>
  );
}

export function LookCard({ look }: { look: Look }) {
  const { byRef, pending, imageProduct, imageError, refetch } = useLookProducts(look);
  const [open, setOpen] = useState<{ index: number; anchor: HTMLElement } | null>(null);
  const influencer = findInfluencer(look.influencer);

  if (pending && !imageProduct) return <LookCardSkeleton />;

  const image = imageProduct?.images[0];
  if (imageError || !imageProduct || !image) {
    return (
      <Box>
        <ErrorState message="לא הצלחנו לטעון את התמונה של הלוק הזה." onRetry={refetch} />
      </Box>
    );
  }

  const spots = look.hotspots
    .map((spot, index) => ({ spot, index, product: byRef.get(String(spot.product)) }))
    .filter((item): item is { spot: Hotspot; index: number; product: Product } => Boolean(item.product));
  const tagged = [...new Map(spots.map((item) => [item.product.id, item.product])).values()];
  const activeSpot = open ? spots.find((item) => item.index === open.index) : undefined;

  return (
    <Box component="article" aria-label={look.caption} sx={{ minWidth: 0 }}>
      <Box sx={{ position: "relative", bgcolor: "#EDE4D6", overflow: "hidden" }}>
        <StoreImage
          src={image.src}
          srcSet={image.srcset}
          sizes="(max-width: 900px) 100vw, 50vw"
          alt={look.imageAlt}
          sx={{ height: "auto" }}
        />
        {spots.map((item) => (
          <Pin
            key={item.index}
            spot={item.spot}
            product={item.product}
            active={open?.index === item.index}
            onOpen={(anchor) => setOpen({ index: item.index, anchor })}
          />
        ))}
        <Popover
          open={Boolean(open && activeSpot)}
          anchorEl={open?.anchor}
          onClose={() => setOpen(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          slotProps={{ paper: { sx: { borderRadius: 0, mt: 0.5 }, role: "dialog", "aria-label": "פרטי מוצר מהלוק" } }}
        >
          {activeSpot ? <HotspotCard product={activeSpot.product} onClose={() => setOpen(null)} /> : null}
        </Popover>
      </Box>
      <Typography sx={{ mt: 1.5, fontWeight: 500 }}>{look.caption}</Typography>
      {influencer ? (
        <MuiLink component={Link} to={`/influencers/${influencer.slug}`} underline="hover" color="secondary" sx={{ fontSize: 14 }}>
          {`מהמומלצים של ${influencer.name}`}
        </MuiLink>
      ) : null}
      {tagged.length ? (
        <Box component="ul" aria-label="מוצרים בלוק" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 0.5 }}>
          {tagged.map((product) => (
            <Box key={product.id} component="li" sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 14, minWidth: 0 }}>
              <MuiLink
                component={Link}
                to={productPath(product.slug)}
                underline="hover"
                color="inherit"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
              >
                {decodeHtmlEntities(product.name)}
              </MuiLink>
              <Box sx={{ flexShrink: 0 }}>
                <Price prices={product.prices} size="sm" />
              </Box>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
