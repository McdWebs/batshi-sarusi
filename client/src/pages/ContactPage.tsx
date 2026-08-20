import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { type FormEvent, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

const WHATSAPP_URL = "https://wa.me/972507721728";
const INSTAGRAM_URL = "https://www.instagram.com/batshi_sarosi";
const SUPPORT_EMAIL = "support@batshi-home.co.il";
const SUPPORT_PHONE = "03-7721728";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [privacy, setPrivacy] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!privacy) return;

    const subject = encodeURIComponent(`פנייה מאתר – ${name}`);
    const body = encodeURIComponent(
      `שם: ${name}\nאימייל: ${email}\nטלפון: ${phone}\n\n${message}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <Box>
      {/* Hero strip */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 3.5 }, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
              fontSize: { xs: 24, md: 28 },
              mb: 0.75,
            }}
          >
            צור קשר
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 480, mx: "auto", lineHeight: 1.6, fontSize: { xs: 14, md: 15 } }}
          >
            שירות לקוחות batshi עומד לשירותך. ניתן לפנות אלינו בוואטסאפ, בטלפון, או למלא את הטופס ונחזור אליכם בהקדם.
          </Typography>
        </Container>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 4, md: 7 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
          gap: { xs: 4, md: 6 },
          alignItems: "start",
        }}
      >
        {/* Left column — contact info cards */}
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* WhatsApp CTA */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "#25D366",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <WhatsAppIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 16 }}>
                  וואטסאפ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  הדרך המהירה ביותר לקבל מענה
                </Typography>
              </Box>
            </Box>
            <Button
              component="a"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              fullWidth
              sx={{
                bgcolor: "#25D366",
                color: "#fff",
                "&:hover": { bgcolor: "#1ebe57" },
              }}
            >
              לחצו לשירות לקוחות בוואטסאפ
            </Button>
          </Paper>

          {/* Info items */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              display: "grid",
              gap: 2.5,
            }}
          >
            <InfoRow
              icon={<AccessTimeIcon sx={{ fontSize: 22, color: "secondary.main" }} />}
              label="שעות פעילות"
              value="ראשון – חמישי, 09:00–16:00"
            />
            <InfoRow
              icon={<PhoneIcon sx={{ fontSize: 22, color: "secondary.main" }} />}
              label="טלפון"
              value={
                <Link href={`tel:${SUPPORT_PHONE.replace(/-/g, "")}`} color="inherit" underline="hover" fontWeight={600}>
                  {SUPPORT_PHONE}
                </Link>
              }
            />
            <InfoRow
              icon={<EmailIcon sx={{ fontSize: 22, color: "secondary.main" }} />}
              label='דוא"ל'
              value={
                <Link href={`mailto:${SUPPORT_EMAIL}`} color="inherit" underline="hover" fontWeight={600}>
                  {SUPPORT_EMAIL}
                </Link>
              }
            />
            <InfoRow
              icon={<LocationOnIcon sx={{ fontSize: 22, color: "secondary.main" }} />}
              label="כתובת"
              value="ת.ד 635 ראש העין"
            />
          </Paper>

          {/* Social */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography fontWeight={700} sx={{ flexShrink: 0 }}>
              עקבו אחרינו
            </Typography>
            <Button
              component="a"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              size="small"
              startIcon={<InstagramIcon />}
              sx={{ borderColor: "divider" }}
            >
              אינסטגרם
            </Button>
          </Paper>
        </Box>

        {/* Right column — form */}
        <Paper
          component="form"
          elevation={0}
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 2.5, sm: 4 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            display: "grid",
            gap: 2.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            שלחו לנו הודעה
          </Typography>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "1fr 1fr" } }}>
            <TextField
              label="שם"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
            />
            <TextField
              label="טלפון"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Box>

          <TextField
            label="אימייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            variant="outlined"
            size="small"
          />

          <TextField
            label="הודעה"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            fullWidth
            multiline
            minRows={5}
            variant="outlined"
            size="small"
          />

          <FormControlLabel
            sx={{ mr: 0, alignItems: "center" }}
            control={
              <Checkbox
                checked={privacy}
                onChange={(_, checked) => setPrivacy(checked)}
                size="small"
                inputProps={{ "aria-required": true }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary" component="span" sx={{ lineHeight: 1.5 }}>
                <Box component="span" aria-hidden="true" sx={{ color: "error.main" }}>
                  *{" "}
                </Box>
                אני מסכימ/ה ל
                <Box
                  component={RouterLink}
                  to="/מדיניות-פרטיות"
                  sx={{ color: "secondary.main", mx: 0.5, textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  מדיניות הפרטיות
                </Box>{" "}
                באתר
              </Typography>
            }
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!privacy}
            size="large"
            sx={{ alignSelf: "start", px: 5 }}
          >
            שליחה
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <Box sx={{ mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.5 }}>{value}</Typography>
      </Box>
    </Box>
  );
}
