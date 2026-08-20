import { Typography, type TypographyProps } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../utils/format";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function AnimatedMoney({
  major,
  suffix = " ₪",
  prefix = "",
  duration = 420,
  sx,
  ...typographyProps
}: {
  major: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
} & Omit<TypographyProps, "children">) {
  const target = Number(major) || 0;
  const [display, setDisplay] = useState(target);
  const [bump, setBump] = useState(false);
  const previousRef = useRef(target);
  const frameRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = target;

    if (!mountedRef.current) {
      mountedRef.current = true;
      setDisplay(target);
      return;
    }

    if (from === target) return;

    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }

    const increasing = target > from;
    if (increasing) {
      setBump(true);
    }

    cancelAnimationFrame(frameRef.current);
    const start = performance.now();
    const delta = target - from;
    let bumpTimer = 0;

    if (increasing) {
      bumpTimer = window.setTimeout(() => setBump(false), duration);
    }

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(from + delta * easeOutCubic(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (bumpTimer) window.clearTimeout(bumpTimer);
      cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return (
    <Typography
      {...typographyProps}
      sx={[
        {
          display: "inline-block",
          transformOrigin: "center",
          transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), color 0.28s ease",
          transform: bump ? "scale(1.08)" : "scale(1)",
          color: bump ? "secondary.main" : undefined,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {prefix}
      {formatMoney(display.toFixed(2), suffix)}
    </Typography>
  );
}
