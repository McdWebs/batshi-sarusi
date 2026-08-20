import { Box, Button, Container, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../api/types";
import { StoreImage } from "./StoreImage";

const HERO_SLIDE_MS = 4500;
const HERO_FADE_MS = 900;

type HeroSlide = {
  key: string;
  src: string;
  srcset?: string;
};

type HomeHeroProps = {
  products?: Product[];
};

export function HomeHero({ products = [] }: HomeHeroProps) {
  const slides = useMemo(() => {
    const next: HeroSlide[] = [];
    for (const product of products) {
      const image = product.images[0];
      if (!image?.src) continue;
      next.push({
        key: `${product.id}-${image.id ?? image.src}`,
        src: image.src,
        srcset: image.srcset || undefined,
      });
      if (next.length >= 7) break;
    }
    return next;
  }, [products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, HERO_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  return (
    <Box
      component="section"
      aria-label="פתיחה"
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: "min(78vh, 640px)", md: "min(88vh, 760px)" },
        display: "flex",
        alignItems: "flex-end",
        color: "#F7F1E8",
        bgcolor: "#2C241E",
        "@keyframes heroZoom": {
          from: { transform: "scale(1.08)" },
          to: { transform: "scale(1)" },
        },
        "@keyframes heroRise": {
          from: { opacity: 0, transform: "translateY(22px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes heroFade": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& [data-hero-anim]": {
            animation: "none !important",
            opacity: 1,
            transform: "none",
          },
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 70% 40%, rgba(143, 61, 42, 0.35), transparent 55%),
            radial-gradient(ellipse 50% 40% at 15% 80%, rgba(247, 241, 232, 0.08), transparent 50%),
            linear-gradient(160deg, #1C1814 0%, #2C241E 45%, #3D3229 100%)
          `,
        }}
      />

      {slides.length > 0 ? (
        <Box
          data-hero-anim
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            animation: "heroFade 1.1s ease-out both",
          }}
        >
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <Box
                key={slide.key}
                sx={{
                  position: "absolute",
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transition: reduceMotion
                    ? "none"
                    : `opacity ${HERO_FADE_MS}ms ease-in-out`,
                  pointerEvents: "none",
                  zIndex: isActive ? 1 : 0,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    transformOrigin: "center center",
                    animation:
                      isActive && !reduceMotion
                        ? "heroZoom 8s ease-out both"
                        : "none",
                  }}
                >
                  <StoreImage
                    src={slide.src}
                    srcSet={slide.srcset}
                    sizes="100vw"
                    alt=""
                    loading={index === 0 ? "eager" : "lazy"}
                    sx={{
                      width: "100%",
                      height: "100%",
                      "& img": {
                        filter: "saturate(0.92) contrast(1.05)",
                      },
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : null}

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: {
            xs: `
              linear-gradient(180deg, rgba(28, 24, 20, 0.35) 0%, rgba(28, 24, 20, 0.55) 38%, rgba(28, 24, 20, 0.92) 100%),
              linear-gradient(90deg, rgba(28, 24, 20, 0.55) 0%, transparent 70%)
            `,
            md: `
              linear-gradient(105deg, rgba(28, 24, 20, 0.92) 0%, rgba(28, 24, 20, 0.72) 38%, rgba(28, 24, 20, 0.28) 68%, rgba(28, 24, 20, 0.45) 100%),
              linear-gradient(180deg, rgba(28, 24, 20, 0.2) 0%, transparent 35%, rgba(28, 24, 20, 0.55) 100%)
            `,
          },
        }}
      />

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          py: { xs: 6, md: 9 },
          pb: { xs: 7, md: 10 },
        }}
      >
        <Box sx={{ maxWidth: { xs: "100%", md: 560 } }}>
          <Typography
            component="p"
            data-hero-anim
            sx={{
              fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
              fontWeight: 600,
              fontSize: { xs: "clamp(3rem, 14vw, 4.5rem)", md: "clamp(4.5rem, 8vw, 6.5rem)" },
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              mb: { xs: 2, md: 2.5 },
              color: "#F7F1E8",
              animation: "heroRise 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            batshi
          </Typography>

          <Typography
            component="h1"
            data-hero-anim
            sx={{
              fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
              fontWeight: 600,
              fontSize: { xs: 26, sm: 30, md: 36 },
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              mb: 1.5,
              maxWidth: "18em",
              animation: "heroRise 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both",
            }}
          >
            הבית לאוהבי הבישול והאירוח
          </Typography>

          <Typography
            data-hero-anim
            sx={{
              fontSize: { xs: 15, md: 17 },
              lineHeight: 1.65,
              color: "rgba(247, 241, 232, 0.78)",
              mb: { xs: 3.5, md: 4 },
              maxWidth: 420,
              animation: "heroRise 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both",
            }}
          >
            כלי מטבח, הגשה ועיצוב שמזמינים לארח — במבחר ובמחירים מהחנות החיה.
          </Typography>

          <Box
            data-hero-anim
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              animation: "heroRise 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.34s both",
            }}
          >
            <Button
              component={Link}
              to="/sale"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#8F3D2A",
                color: "#F7F1E8",
                px: 3.5,
                "&:hover": { bgcolor: "#7A3424" },
              }}
            >
              למבצעים
            </Button>
            <Button
              component={Link}
              to="/shop"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "rgba(247, 241, 232, 0.55)",
                color: "#F7F1E8",
                px: 3.5,
                "&:hover": {
                  borderColor: "#F7F1E8",
                  bgcolor: "rgba(247, 241, 232, 0.08)",
                },
              }}
            >
              לכל החנות
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
