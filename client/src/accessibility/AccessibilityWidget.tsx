import { Box, Button, IconButton, Typography } from "@mui/material";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import MotionPhotosOffIcon from "@mui/icons-material/MotionPhotosOff";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import ContrastIcon from "@mui/icons-material/Contrast";
import PaletteIcon from "@mui/icons-material/Palette";
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import LinkIcon from "@mui/icons-material/Link";
import TitleIcon from "@mui/icons-material/Title";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import GavelIcon from "@mui/icons-material/Gavel";
import FeedbackIcon from "@mui/icons-material/Feedback";
import PhoneIcon from "@mui/icons-material/Phone";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useA11yStore } from "./store";

const STATEMENT = "/הצהרת-נגישות";
const CONTACT = "/צור-קשר";
const COORDINATOR_TEL = "036347080";

function Tile({
  icon,
  label,
  detail,
  active,
  onClick,
  to,
  href,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  active?: boolean;
  onClick?: () => void;
  to?: string;
  href?: string;
}) {
  const shared = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: { xs: 0.25, sm: 0.75 },
    minHeight: { xs: 72, sm: 108 },
    px: { xs: 0.5, sm: 1 },
    py: { xs: 0.5, sm: 1.25 },
    borderRadius: 1.5,
    border: "1px solid",
    borderColor: active ? "#0b57d0" : "rgba(44,36,30,0.12)",
    bgcolor: active ? "rgba(11,87,208,0.08)" : "#FFFbf5",
    color: "text.primary",
    textAlign: "center",
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": { borderColor: "#0b57d0", bgcolor: "rgba(11,87,208,0.06)" },
    "&:focus-visible": { outline: "3px solid #0b57d0", outlineOffset: 2 },
  } as const;

  const content = (
    <>
      <Box sx={{ color: active ? "#0b57d0" : "#2C241E", display: "flex", "& .MuiSvgIcon-root": { fontSize: { xs: 20, sm: 24 } } }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: { xs: 11, sm: 13 }, fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
      {detail ? (
        <Typography sx={{ fontSize: { xs: 10, sm: 11 }, color: active ? "#0b57d0" : "text.secondary", lineHeight: 1.2 }}>
          {detail}
        </Typography>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Box component={Link} to={to} onClick={onClick} sx={shared}>
        {content}
      </Box>
    );
  }
  if (href) {
    return (
      <Box component="a" href={href} sx={shared}>
        {content}
      </Box>
    );
  }
  return (
    <Box component="button" type="button" onClick={onClick} sx={{ ...shared, font: "inherit" }}>
      {content}
    </Box>
  );
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const a11y = useA11yStore();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const contrastLabel = a11y.contrast === "off" ? "כבוי" : a11y.contrast === "dark" ? "כהה" : "צהוב";
  const colorLabel =
    a11y.colorBlind === "off"
      ? "כבוי"
      : a11y.colorBlind === "protanopia"
        ? "פרוטנופיה"
        : a11y.colorBlind === "deuteranopia"
          ? "דאוטרנופיה"
          : "טריטנופיה";
  const cursorLabel = a11y.cursor === "off" ? "כבוי" : a11y.cursor === "black" ? "שחור" : "לבן";

  return (
    <>
      {open ? null : (
        <IconButton
          aria-label="תפריט נגישות"
          aria-expanded={open}
          aria-controls="accessibility-menu"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1500,
            bgcolor: "#0b57d0",
            color: "#fff",
            width: 56,
            height: 56,
            boxShadow: "0 8px 24px rgba(11,87,208,0.35)",
            "&:hover": { bgcolor: "#0842a0" },
          }}
        >
          <AccessibilityNewIcon />
        </IconButton>
      )}
      {open ? (
        <>
          <Box
            aria-hidden
            onClick={() => setOpen(false)}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 1499,
              bgcolor: "rgba(28,24,20,0.4)",
            }}
          />
          <Box
          id="accessibility-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          sx={{
            position: "fixed",
            right: { xs: 0, sm: 16 },
            left: { xs: 0, sm: "auto" },
            bottom: { xs: 0, sm: 16 },
            zIndex: 1500,
            width: { xs: "100%", sm: 400 },
            maxHeight: { xs: "80vh", sm: "min(720px, calc(100vh - 32px))" },
            display: "flex",
            flexDirection: "column",
            bgcolor: "#F4EEE4",
            borderRadius: { xs: "16px 16px 0 0", sm: 2 },
            boxShadow: "0 16px 48px rgba(28,24,20,0.28)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5 },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1.5 },
              minHeight: { xs: 44, sm: 64 },
              bgcolor: "#0b57d0",
              color: "#fff",
            }}
          >
            <AccessibilityNewIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Typography
              id="a11y-title"
              variant="h6"
              component="h2"
              sx={{ flex: 1, color: "inherit", fontSize: { xs: 16, sm: 20 }, lineHeight: 1.2 }}
            >
              תפריט נגישות
            </Typography>
            <IconButton aria-label="סגירה" onClick={() => setOpen(false)} size="small" sx={{ color: "#fff" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ p: { xs: 1, sm: 1.5 }, overflow: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: { xs: 0.75, sm: 1 },
              }}
            >
              <Tile
                icon={<KeyboardIcon />}
                label="ניווט מקלדת"
                detail={a11y.keyboard ? "פעיל" : "כבוי"}
                active={a11y.keyboard}
                onClick={() => a11y.setKeyboard(!a11y.keyboard)}
              />
              <Tile
                icon={<RecordVoiceOverIcon />}
                label="קורא מסך"
                detail={a11y.screenReader ? "פעיל" : "כבוי"}
                active={a11y.screenReader}
                onClick={() => a11y.setScreenReader(!a11y.screenReader)}
              />
              <Tile
                icon={<MotionPhotosOffIcon />}
                label="חסימת הבהובים"
                detail={a11y.stopMotion ? "פעיל" : "כבוי"}
                active={a11y.stopMotion}
                onClick={() => a11y.setStopMotion(!a11y.stopMotion)}
              />
              <Tile
                icon={<TextIncreaseIcon />}
                label="הגדלת פונט"
                detail={`${a11y.fontScale + 1} / 4`}
                active={a11y.fontScale > 0}
                onClick={() => a11y.cycleFont()}
              />
              <Tile
                icon={<ContrastIcon />}
                label="ניגודיות"
                detail={contrastLabel}
                active={a11y.contrast !== "off"}
                onClick={() => a11y.cycleContrast()}
              />
              <Tile
                icon={<PaletteIcon />}
                label="עיוורי צבעים"
                detail={colorLabel}
                active={a11y.colorBlind !== "off"}
                onClick={() => a11y.cycleColorBlind()}
              />
              <Tile
                icon={<FontDownloadIcon />}
                label="פונט קריא"
                detail={a11y.readableFont ? "פעיל" : "כבוי"}
                active={a11y.readableFont}
                onClick={() => a11y.setReadableFont(!a11y.readableFont)}
              />
              <Tile
                icon={<AdsClickIcon />}
                label="סמן מוגדל"
                detail={cursorLabel}
                active={a11y.cursor !== "off"}
                onClick={() => a11y.cycleCursor()}
              />
              <Tile
                icon={<ZoomInIcon />}
                label="תצוגה 200%"
                detail={a11y.zoom ? "פעיל" : "כבוי"}
                active={a11y.zoom}
                onClick={() => a11y.setZoom(!a11y.zoom)}
              />
              <Tile
                icon={<LinkIcon />}
                label="הדגשת קישורים"
                detail={a11y.highlightLinks ? "פעיל" : "כבוי"}
                active={a11y.highlightLinks}
                onClick={() => a11y.setHighlightLinks(!a11y.highlightLinks)}
              />
              <Tile
                icon={<TitleIcon />}
                label="הדגשת כותרות"
                detail={a11y.highlightHeadings ? "פעיל" : "כבוי"}
                active={a11y.highlightHeadings}
                onClick={() => a11y.setHighlightHeadings(!a11y.highlightHeadings)}
              />
              <Tile
                icon={<ImageSearchIcon />}
                label="תיאור לתמונות"
                detail={a11y.showAlts ? "פעיל" : "כבוי"}
                active={a11y.showAlts}
                onClick={() => a11y.setShowAlts(!a11y.showAlts)}
              />
              <Tile icon={<GavelIcon />} label="הצהרת נגישות" to={STATEMENT} onClick={() => setOpen(false)} />
              <Tile icon={<FeedbackIcon />} label="משוב נגישות" to={CONTACT} onClick={() => setOpen(false)} />
              <Tile icon={<PhoneIcon />} label="רכז נגישות" detail="03-6347080" href={`tel:${COORDINATOR_TEL}`} />
              <Tile icon={<RestartAltIcon />} label="איפוס הגדרות" onClick={() => a11y.reset()} />
            </Box>
            <Button fullWidth onClick={() => setOpen(false)} sx={{ mt: 1 }}>
              סגירה
            </Button>
          </Box>
        </Box>
        </>
      ) : null}
      {a11y.screenReader ? (
        <Box
          component="p"
          sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
        >
          מצב קורא מסך פעיל. מומלץ להשתמש ב־NVDA. ניווט עם Tab, חיצים, Enter ו־Esc.
        </Box>
      ) : null}
    </>
  );
}
