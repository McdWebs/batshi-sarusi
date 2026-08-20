import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useConsentStore } from "./store";

export function CookieConsent() {
  const ready = useConsentStore((s) => s.ready);
  const decided = useConsentStore((s) => s.decided);
  const preferences = useConsentStore((s) => s.preferences);
  const preferencesOpen = useConsentStore((s) => s.preferencesOpen);
  const init = useConsentStore((s) => s.init);
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);
  const save = useConsentStore((s) => s.save);
  const openPreferences = useConsentStore((s) => s.openPreferences);
  const closePreferences = useConsentStore((s) => s.closePreferences);

  const [statistics, setStatistics] = useState(preferences.statistics);
  const [marketing, setMarketing] = useState(preferences.marketing);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (preferencesOpen) {
      setStatistics(preferences.statistics);
      setMarketing(preferences.marketing);
    }
  }, [preferencesOpen, preferences.statistics, preferences.marketing]);

  if (!ready) return null;

  return (
    <>
      {!decided && (
        <Box
          role="dialog"
          aria-labelledby="cookie-consent-title"
          sx={{
            position: "fixed",
            insetInline: { xs: 12, sm: 20 },
            bottom: { xs: 12, sm: 20 },
            zIndex: 1400,
            maxWidth: 720,
            mx: "auto",
            bgcolor: "background.paper",
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            px: { xs: 2, md: 2.5 },
            py: { xs: 2, md: 2.25 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 1.75, sm: 2.5 },
            boxShadow: "0 12px 40px rgba(28, 24, 20, 0.12)",
          }}
        >
          <Box flex={1} minWidth={0}>
            <Typography
              id="cookie-consent-title"
              component="h2"
              sx={{
                fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: { xs: 17, sm: 18 },
                mb: 0.5,
                color: "text.primary",
              }}
            >
              שימוש בעוגיות
            </Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.65, color: "text.secondary" }}>
              האתר משתמש בעוגיות ובכלים אנליטיים לשיפור חוויית השימוש ולהתאמת התוכן.{" "}
              <Box
                component={RouterLink}
                to="/מדיניות-פרטיות"
                sx={{
                  color: "secondary.main",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  fontWeight: 500,
                }}
              >
                מדיניות פרטיות
              </Box>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: { xs: "stretch", sm: "flex-end" },
              flexShrink: 0,
              "& > *": { flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" } },
            }}
          >
            <Button variant="text" color="inherit" onClick={openPreferences} sx={{ color: "text.secondary" }}>
              העדפות
            </Button>
            <Button variant="outlined" color="primary" onClick={rejectAll}>
              דחייה
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={acceptAll}
              sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}
            >
              אישור הכל
            </Button>
          </Box>
        </Box>
      )}

      <Dialog
        open={preferencesOpen}
        onClose={closePreferences}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
            fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
            fontWeight: 600,
          }}
        >
          העדפות עוגיות
          <IconButton aria-label="סגירה" onClick={closePreferences} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "divider" }}>
          <Typography color="text.secondary" mb={2} sx={{ fontSize: 14, lineHeight: 1.65 }}>
            בחרו אילו סוגי עוגיות לאפשר באתר:
          </Typography>

          <PreferenceBlock
            title="הכרחיות"
            description="עוגיות הכרחיות לתפקוד בסיסי של האתר, כולל עגלה והעדפות הסכמה. לא ניתן לבטל אותן."
            checked
            disabled
          />
          <PreferenceBlock
            title="סטטיסטיקה"
            description="איסוף מידע אנונימי על אופן השימוש באתר, כולל ייחוס מקור הזמנה (Sourcebuster)."
            checked={statistics}
            onChange={setStatistics}
          />
          <PreferenceBlock
            title="שיווק"
            description="עוגיות לפרסום והתאמת תוכן שיווקי. כרגע לא נטענים סקריפטים שיווקיים אלא אם קטגוריה זו מופעלת."
            checked={marketing}
            onChange={setMarketing}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
          <Button variant="text" color="inherit" onClick={closePreferences} sx={{ color: "text.secondary" }}>
            סגירה
          </Button>
          <Box flex={1} />
          <Button variant="outlined" color="primary" onClick={acceptAll}>
            אישור הכל
          </Button>
          <Button variant="contained" color="primary" onClick={() => save({ statistics, marketing })}>
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function PreferenceBlock({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.default",
        p: 2,
        mb: 1.5,
      }}
    >
      <FormControlLabel
        sx={{ m: 0, width: "100%", justifyContent: "space-between", ml: 0 }}
        labelPlacement="start"
        control={
          <Switch
            checked={checked}
            disabled={disabled}
            onChange={(_, value) => onChange?.(value)}
            color="secondary"
          />
        }
        label={
          <Typography fontWeight={700} component="span" sx={{ color: "text.primary" }}>
            {title}
          </Typography>
        }
      />
      <Typography variant="body2" color="text.secondary" mt={1} sx={{ lineHeight: 1.6 }}>
        {description}
      </Typography>
    </Box>
  );
}
