import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import { Link as RouterLink } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { generateStudioContent, getStudioSample } from "../api/store";
import type { StudioContent, StudioSample } from "../api/types";
import { Price } from "../components/Price";
import { ProductImagePlaceholder } from "../components/ProductImagePlaceholder";
import { EmptyState, ErrorState } from "../components/States";
import { StoreImage } from "../components/StoreImage";
import { AccessCodeForm } from "../components/AccessCodeForm";
import { listDemoIds, removeDemoEntry, setDemoEntry } from "../studio/demoStore";
import { setStudioKey } from "../studio/studioKey";
import { productPath } from "../utils/format";

type Generation =
  | { status: "loading" }
  | {
      status: "done";
      content: StudioContent;
      model: string;
      /** Earlier drafts of this product, newest last, so a rephrase can be undone. */
      history: StudioContent[];
      revising?: boolean;
      reviseError?: string;
    }
  | { status: "error"; message: string };

const CONCURRENCY = 2;
const REPHRASE_SUGGESTIONS = ["קצר יותר", "יוקרתי יותר", "חם ואישי", "פשוט וישיר", "להדגיש שימוש באירוח", "פחות מילים טכניות"];
const GREEN = "#2E6B4F";
const AI_TINT = "rgba(143, 61, 42, 0.05)";
const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

function displayName(name: string) {
  return name
    .replace(/^חדש\s*!+\s*/, "")
    .replace(/\s*[-–]\s*במבצע.*$/, "")
    .trim();
}

function googleUrl(permalink: string) {
  try {
    const url = new URL(permalink);
    const parts = url.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
    return [url.host, ...parts].join(" › ");
  } catch {
    return permalink;
  }
}

function CopyIconButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <ButtonBase
      aria-label={`העתקת ${label}`}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        });
      }}
      sx={{ color: copied ? GREEN : "text.secondary", p: 0.5, borderRadius: 0.5, "&:hover": { color: "text.primary", bgcolor: "action.hover" } }}
    >
      {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />}
    </ButtonBase>
  );
}

function StatusBadge({ generation, applied }: { generation?: Generation; applied?: boolean }) {
  if (applied) {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "#fff", bgcolor: GREEN, fontSize: 11, fontWeight: 700, px: 0.75, py: 0.1 }}>
        <CheckIcon sx={{ fontSize: 13 }} />
        הוחל (הדגמה)
      </Box>
    );
  }
  if (generation?.status === "loading") {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, color: "text.secondary", fontSize: 12 }}>
        <CircularProgress size={11} thickness={6} color="inherit" />
        מייצר…
      </Box>
    );
  }
  if (generation?.status === "done") {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: GREEN, fontSize: 12, fontWeight: 600 }}>
        <CheckIcon sx={{ fontSize: 14 }} />
        מוכן
      </Box>
    );
  }
  if (generation?.status === "error") {
    return (
      <Typography component="span" sx={{ fontSize: 12, color: "secondary.main", fontWeight: 600 }}>
        שגיאה
      </Typography>
    );
  }
  return (
    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
      ממתין
    </Typography>
  );
}

function ProductList({
  items,
  generations,
  appliedIds,
  selectedId,
  onSelect,
}: {
  items: StudioSample[];
  generations: Record<number, Generation>;
  appliedIds: Set<number>;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <Box
      component="ul"
      aria-label="מוצרים ללא תיאור"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "flex",
        flexDirection: { xs: "row", md: "column" },
        gap: { xs: 1, md: 0 },
        overflowX: { xs: "auto", md: "visible" },
        pb: { xs: 1, md: 0 },
        border: { md: "1px solid" },
        borderColor: { md: "divider" },
        bgcolor: { md: "background.paper" },
        position: { md: "sticky" },
        top: { md: 96 },
        alignSelf: "start",
      }}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Box component="li" key={item.id} sx={{ flex: { xs: "0 0 148px", md: "none" }, "& + &": { borderTop: { md: "1px solid" }, borderColor: { md: "divider" } } }}>
            <ButtonBase
              onClick={() => onSelect(item.id)}
              aria-current={selected ? "true" : undefined}
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                gap: { xs: 1, md: 1.5 },
                textAlign: "start",
                p: { xs: 1, md: 1.5 },
                border: { xs: "1px solid", md: "none" },
                borderColor: { xs: selected ? "text.primary" : "divider" },
                bgcolor: selected ? { xs: "background.paper", md: "#F4EEE4" } : { xs: "background.paper", md: "transparent" },
                boxShadow: { md: selected ? "inset -3px 0 0 #2C241E" : "none" },
                "&:hover": { bgcolor: { md: "#F9F4EB" } },
              }}
            >
              <Box sx={{ width: { xs: "100%", md: 52 }, aspectRatio: "1 / 1", flexShrink: 0, bgcolor: "#EDE4D6", overflow: "hidden" }}>
                {item.image ? <StoreImage src={item.image.thumbnail || item.image.src} alt="" /> : <ProductImagePlaceholder />}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    lineHeight: 1.35,
                    fontWeight: selected ? 600 : 500,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    mb: 0.5,
                  }}
                >
                  {displayName(item.name)}
                </Typography>
                <StatusBadge generation={generations[item.id]} applied={appliedIds.has(item.id)} />
              </Box>
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
}

function Tag({ children, tone }: { children: string; tone: "before" | "after" }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        px: 0.9,
        py: 0.15,
        bgcolor: tone === "after" ? "secondary.main" : "#E7DFD2",
        color: tone === "after" ? "#fff" : "text.secondary",
      }}
    >
      {children}
    </Box>
  );
}

function Missing({ children }: { children: string }) {
  return (
    <Box
      component="span"
      sx={{ display: "inline-block", fontSize: 12.5, color: "text.secondary", border: "1px dashed", borderColor: "rgba(44,36,30,0.28)", px: 1, py: 0.25 }}
    >
      {children}
    </Box>
  );
}

function CompareRow({
  label,
  hint,
  before,
  after,
  copy,
  generation,
}: {
  label: string;
  hint?: string;
  before: React.ReactNode;
  after?: React.ReactNode;
  copy?: string;
  generation?: Generation;
}) {
  const loading = generation?.status === "loading" || (generation?.status === "done" && Boolean(generation.revising));
  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, px: 2, pt: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{label}</Typography>
        {hint ? (
          <Typography sx={{ fontSize: 11, color: "text.secondary", fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>{hint}</Typography>
        ) : null}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } }}>
        <Box sx={{ px: 2, py: 1.5, fontSize: 14, minWidth: 0 }}>
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 0.5 }}>
            <Tag tone="before">היום באתר</Tag>
          </Box>
          {before}
        </Box>
        <Box sx={{ px: 2, py: 1.5, fontSize: 14, bgcolor: AI_TINT, minWidth: 0, position: "relative" }}>
          <Box sx={{ display: { xs: "flex", md: "none" }, mb: 0.5, justifyContent: "space-between", alignItems: "center" }}>
            <Tag tone="after">הצעת AI</Tag>
            {copy ? <CopyIconButton text={copy} label={label} /> : null}
          </Box>
          {copy ? (
            <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", top: 6, insetInlineEnd: 8 }}>
              <CopyIconButton text={copy} label={label} />
            </Box>
          ) : null}
          {loading ? (
            <Box aria-hidden="true">
              <Skeleton variant="rectangular" animation="wave" height={14} width="92%" sx={{ ...bone, mb: 0.75 }} />
              <Skeleton variant="rectangular" animation="wave" height={14} width="70%" sx={bone} />
            </Box>
          ) : (
            after ?? <Typography sx={{ color: "text.secondary", fontSize: 13 }}>—</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function GooglePreview({ title, url, meta, muted }: { title: string; url: string; meta?: string; muted?: boolean }) {
  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid", borderColor: "divider", p: 1.5, direction: "rtl", overflow: "hidden" }}>
      <Typography sx={{ fontSize: 12, color: "#4D5156", mb: 0.25, direction: "ltr", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {url}
      </Typography>
      <Typography
        sx={{
          fontSize: 18,
          lineHeight: 1.3,
          color: muted ? "#6A6158" : "#1A0DAB",
          mb: 0.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: "#4D5156" }}>{meta ?? "אין תיאור מטא — גוגל בוחר קטע אקראי מהעמוד."}</Typography>
    </Box>
  );
}

function RephrasePanel({
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  error?: string;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const canSubmit = text.trim().length > 0 && !busy;
  const submit = () => {
    if (canSubmit) onSubmit(text.trim());
  };
  const addSuggestion = (suggestion: string) => setText((current) => (current.trim() ? `${current.trim()}, ${suggestion}` : suggestion));

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2, mb: 2 }}>
      <TextField
        autoFocus
        fullWidth
        multiline
        minRows={2}
        maxRows={5}
        label="איך לנסח מחדש?"
        placeholder="למשל: קצר יותר, בטון יוקרתי, להדגיש שימוש בשבת"
        value={text}
        onChange={(event) => setText(event.target.value.slice(0, 300))}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            submit();
          }
        }}
        helperText={`${text.length}/300 · Ctrl/⌘ + Enter לשליחה`}
        disabled={busy}
      />
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1.5 }} role="group" aria-label="הצעות ניסוח">
        {REPHRASE_SUGGESTIONS.map((suggestion) => (
          <Chip key={suggestion} label={suggestion} size="small" variant="outlined" onClick={() => addSuggestion(suggestion)} disabled={busy} sx={{ borderRadius: 0 }} />
        ))}
      </Box>
      {error ? (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      ) : null}
      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={submit}
          disabled={!canSubmit}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighOutlinedIcon sx={{ fontSize: 17 }} />}
        >
          {busy ? "מנסח…" : "נסחי מחדש"}
        </Button>
        <Button size="small" variant="text" onClick={onCancel} disabled={busy}>
          ביטול
        </Button>
      </Box>
    </Box>
  );
}

function ApplyDemoDialog({
  open,
  names,
  onClose,
  onConfirm,
}: {
  open: boolean;
  names: string[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const many = names.length > 1;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="apply-demo-title">
      <DialogTitle id="apply-demo-title" sx={{ fontFamily: '"Noto Serif Hebrew", serif', fontWeight: 600 }}>
        {many ? `החלה בחנות (הדגמה) — ${names.length} מוצרים` : "החלה בחנות (הדגמה)"}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 1.5, fontSize: 14 }}>
          {many ? "הטיוטות של כל המוצרים המוכנים" : `הטיוטה של "${names[0] ?? ""}"`} יוחלו על המוצר: תיאור ונקודות מפרט, כותרת SEO, תיאור מטא וטקסט חלופי לתמונה.
        </Typography>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          זה מצב הדגמה. התוכן נשמר רק בדפדפן הזה ויוצג בדף המוצר עם תווית הדגמה. שום דבר לא נכתב ל-WooCommerce, כי החנות עדיין לא מחוברת.
        </Alert>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>אפשר לבטל את ההחלה בכל רגע.</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>ביטול</Button>
        <Button variant="contained" onClick={onConfirm} autoFocus>
          החלה (הדגמה)
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Workspace({
  sample,
  generation,
  applied,
  onGenerate,
  onRevise,
  onUndo,
  onApply,
  onUnapply,
}: {
  sample: StudioSample;
  generation?: Generation;
  applied: boolean;
  onGenerate: () => void;
  onRevise: (instruction: string) => Promise<boolean>;
  onUndo: () => void;
  onApply: () => void;
  onUnapply: () => void;
}) {
  const [rephraseOpen, setRephraseOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const content = generation?.status === "done" ? generation.content : null;
  const revising = generation?.status === "done" && Boolean(generation.revising);
  const reviseError = generation?.status === "done" ? generation.reviseError : undefined;
  const historyCount = generation?.status === "done" ? generation.history.length : 0;
  const loading = generation?.status === "loading";
  const beforeDescription = sample.before.description || sample.before.shortDescription;
  const specText = sample.attributes.map((attribute) => `${attribute.name}: ${attribute.values.join(" / ")}`);
  const allText = content
    ? [content.description, "", ...content.bullets.map((bullet) => `• ${bullet}`), "", content.seoTitle, content.metaDescription, content.imageAlt].join("\n")
    : "";

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <Box sx={{ width: 72, height: 72, flexShrink: 0, bgcolor: "#EDE4D6", overflow: "hidden" }}>
          {sample.image ? <StoreImage src={sample.image.thumbnail || sample.image.src} alt={sample.image.alt || sample.name} /> : <ProductImagePlaceholder />}
        </Box>
        <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Noto Serif Hebrew", serif', fontWeight: 600, lineHeight: 1.35, fontSize: { xs: 17, md: 20 } }}>
            {displayName(sample.name)}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mt: 0.5 }}>
            <Price prices={sample.price} size="sm" />
            {sample.categories.slice(0, 2).map((category) => (
              <Typography key={category} sx={{ fontSize: 12, color: "text.secondary" }}>
                {category}
              </Typography>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          {content ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => void navigator.clipboard.writeText(allText)}
            >
              העתקת הכול
            </Button>
          ) : null}
          {historyCount > 0 ? (
            <Button size="small" variant="text" startIcon={<UndoIcon sx={{ fontSize: 16 }} />} onClick={onUndo} disabled={revising}>
              גרסה קודמת
            </Button>
          ) : null}
          {content ? (
            <>
              <Button
                variant={rephraseOpen ? "contained" : "outlined"}
                size="small"
                disabled={revising}
                startIcon={<AutoFixHighOutlinedIcon sx={{ fontSize: 17 }} />}
                aria-expanded={rephraseOpen}
                onClick={() => setRephraseOpen((open) => !open)}
              >
                ניסוח מחדש
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={revising}
                startIcon={<PublishOutlinedIcon sx={{ fontSize: 17 }} />}
                onClick={() => setApplyOpen(true)}
                sx={{ bgcolor: GREEN, "&:hover": { bgcolor: "#255740" } }}
              >
                {applied ? "החלה מחדש בחנות" : "החלה בחנות"}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={onGenerate}
            >
              {loading ? "מייצר…" : "יצירה עם AI"}
            </Button>
          )}
        </Box>
      </Box>

      <ApplyDemoDialog
        open={applyOpen}
        names={[displayName(sample.name)]}
        onClose={() => setApplyOpen(false)}
        onConfirm={() => {
          setApplyOpen(false);
          onApply();
        }}
      />

      {applied ? (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Button color="inherit" size="small" component={RouterLink} to={productPath(sample.slug)}>
                צפייה בדף המוצר
              </Button>
              <Button color="inherit" size="small" onClick={onUnapply}>
                ביטול ההחלה
              </Button>
            </Box>
          }
        >
          הוחל במצב הדגמה. שום דבר לא נכתב ל-WooCommerce.
        </Alert>
      ) : null}

      {content && rephraseOpen ? (
        <RephrasePanel
          busy={revising}
          error={reviseError}
          onCancel={() => setRephraseOpen(false)}
          onSubmit={(instruction) => {
            void onRevise(instruction).then((ok) => {
              if (ok) setRephraseOpen(false);
            });
          }}
        />
      ) : null}

      {generation?.status === "error" ? (
        <Box sx={{ mb: 2 }}>
          <ErrorState message={generation.message} onRetry={onGenerate} />
        </Box>
      ) : null}

      <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <Box sx={{ px: 2, py: 1.25 }}>
            <Tag tone="before">היום באתר</Tag>
          </Box>
          <Box sx={{ px: 2, py: 1.25, bgcolor: AI_TINT }}>
            <Tag tone="after">הצעת AI — לאישור</Tag>
          </Box>
        </Box>

        <CompareRow
          label="תיאור מוצר"
          generation={generation}
          before={beforeDescription ? <Typography sx={{ fontSize: 14 }}>{beforeDescription}</Typography> : <Missing>ריק — רואים רק שם ותמונה</Missing>}
          after={content ? <Typography sx={{ fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line", pr: { md: 3 } }}>{content.description}</Typography> : undefined}
          copy={content?.description}
        />
        <CompareRow
          label="נקודות מפרט"
          generation={generation}
          before={
            specText.length ? (
              <Box component="ul" sx={{ m: 0, pl: 0, pr: 2.25, fontSize: 13.5 }}>
                {specText.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </Box>
            ) : (
              <Missing>אין</Missing>
            )
          }
          after={
            content ? (
              <Box component="ul" sx={{ m: 0, pl: 0, pr: 2.25 + 3, fontSize: 14, lineHeight: 1.6 }}>
                {content.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </Box>
            ) : undefined
          }
          copy={content ? content.bullets.map((bullet) => `• ${bullet}`).join("\n") : undefined}
        />
        <CompareRow
          label="טקסט חלופי לתמונה"
          hint={content ? `${content.imageAlt.length}/125` : undefined}
          generation={generation}
          before={sample.before.imageAlt ? <Typography sx={{ fontSize: 14 }}>{sample.before.imageAlt}</Typography> : <Missing>חסר — בעיית נגישות ו-SEO</Missing>}
          after={content ? <Typography sx={{ fontSize: 14, pr: { md: 3 } }}>{content.imageAlt}</Typography> : undefined}
          copy={content?.imageAlt}
        />
        <CompareRow
          label="כך זה נראה בגוגל"
          hint={content ? `כותרת ${content.seoTitle.length}/60 · תיאור ${content.metaDescription.length}/155` : undefined}
          generation={generation}
          before={<GooglePreview muted title={sample.name} url={googleUrl(sample.permalink)} />}
          after={content ? <GooglePreview title={content.seoTitle} url={googleUrl(sample.permalink)} meta={content.metaDescription} /> : undefined}
          copy={content ? `${content.seoTitle}\n${content.metaDescription}` : undefined}
        />
      </Box>
    </Box>
  );
}

export function StudioPage() {
  const sampleQuery = useQuery({
    queryKey: ["studio", "sample"],
    queryFn: getStudioSample,
    staleTime: 5 * 60_000,
    // A wrong or missing access code will not fix itself, so do not retry it.
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
  });
  const needsCode = sampleQuery.error instanceof ApiError && sampleQuery.error.status === 401;
  const [codeTried, setCodeTried] = useState(false);
  const [generations, setGenerations] = useState<Record<number, Generation>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const running = useRef(new Set<number>());
  const [appliedIds, setAppliedIds] = useState<Set<number>>(() => new Set(listDemoIds()));
  const [applyAllOpen, setApplyAllOpen] = useState(false);

  const items = useMemo(() => sampleQuery.data?.items ?? [], [sampleQuery.data]);

  useEffect(() => {
    if (selectedId === null && items.length > 0) setSelectedId(items[0]!.id);
  }, [items, selectedId]);

  const generate = useCallback(async (id: number) => {
    if (running.current.has(id)) return;
    running.current.add(id);
    setGenerations((current) => ({ ...current, [id]: { status: "loading" } }));
    try {
      const result = await generateStudioContent(id);
      setGenerations((current) => ({ ...current, [id]: { status: "done", content: result.content, model: result.model, history: [] } }));
    } catch (error) {
      setGenerations((current) => ({
        ...current,
        [id]: { status: "error", message: error instanceof Error ? error.message : "משהו השתבש. נסו שוב בעוד רגע." },
      }));
    } finally {
      running.current.delete(id);
    }
  }, []);

  /** Rewrites the current draft following the editor's instruction. A failure keeps the draft that is already on screen. */
  const revise = useCallback(
    async (id: number, instruction: string): Promise<boolean> => {
      const current = generations[id];
      if (current?.status !== "done" || running.current.has(id)) return false;
      running.current.add(id);
      setGenerations((all) => ({ ...all, [id]: { ...current, revising: true, reviseError: undefined } }));
      try {
        const result = await generateStudioContent(id, { instruction, previous: current.content });
        setGenerations((all) => ({
          ...all,
          [id]: { status: "done", content: result.content, model: result.model, history: [...current.history, current.content] },
        }));
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "משהו השתבש. נסו שוב בעוד רגע.";
        setGenerations((all) => ({ ...all, [id]: { ...current, revising: false, reviseError: message } }));
        return false;
      } finally {
        running.current.delete(id);
      }
    },
    [generations],
  );

  const undo = useCallback((id: number) => {
    setGenerations((all) => {
      const current = all[id];
      if (current?.status !== "done" || current.history.length === 0) return all;
      const history = current.history.slice(0, -1);
      const content = current.history[current.history.length - 1]!;
      return { ...all, [id]: { status: "done", content, model: current.model, history } };
    });
  }, []);

  const generateAll = useCallback(async () => {
    const queue = items.filter((item) => generations[item.id]?.status !== "done").map((item) => item.id);
    const worker = async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
        await generate(id);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }, [generate, generations, items]);

  /** Demo apply: records the current draft in this browser only. Nothing is sent to WooCommerce. */
  const applyDemo = useCallback(
    (ids: number[]) => {
      const applied: number[] = [];
      for (const id of ids) {
        const entry = generations[id];
        if (entry?.status === "done") {
          setDemoEntry(id, entry.content);
          applied.push(id);
        }
      }
      setAppliedIds((current) => new Set([...current, ...applied]));
    },
    [generations],
  );

  const unapplyDemo = useCallback((id: number) => {
    removeDemoEntry(id);
    setAppliedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const busy = Object.values(generations).some((entry) => entry.status === "loading");
  const doneCount = Object.values(generations).filter((entry) => entry.status === "done").length;
  const readyToApply = items.filter((item) => generations[item.id]?.status === "done" && !appliedIds.has(item.id));
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "secondary.main", mb: 0.5 }}>דמו פנימי · מצב הדגמה</Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 26, md: 34 }, lineHeight: 1.2 }}>
            סטודיו תוכן מוצרים
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 14, maxWidth: 560 }}>
            מוצרים אמיתיים מהחנות החיה בלי תיאור. ה-AI כותב טיוטה בעברית, ואת מאשרת או עורכת. שום דבר לא נשלח ל-WooCommerce.
          </Typography>
        </Box>
        {items.length > 0 ? (
          <Box sx={{ minWidth: 220, display: "grid", gap: 1 }}>
            <Button variant="contained" onClick={() => void generateAll()} disabled={busy || doneCount === items.length}>
              {busy ? "מייצר…" : doneCount === items.length ? "הכול מוכן" : "יצירה לכל המוצרים"}
            </Button>
            {readyToApply.length > 0 ? (
              <Button
                variant="outlined"
                disabled={busy}
                startIcon={<PublishOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => setApplyAllOpen(true)}
              >
                החלת כל המוכנים ({readyToApply.length})
              </Button>
            ) : null}
            <Box>
              <LinearProgress
                variant="determinate"
                value={(doneCount / items.length) * 100}
                aria-label="התקדמות"
                sx={{ height: 4, bgcolor: "#E7DFD2", "& .MuiLinearProgress-bar": { bgcolor: GREEN } }}
              />
              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
                {doneCount} מתוך {items.length} מוכנים
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Box>

      {sampleQuery.isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px 1fr" }, gap: 3 }} aria-busy="true" aria-label="טוען מוצרים">
          <Skeleton variant="rectangular" animation="wave" height={420} sx={bone} />
          <Skeleton variant="rectangular" animation="wave" height={420} sx={bone} />
        </Box>
      ) : needsCode ? (
        <AccessCodeForm
          wrong={codeTried}
          onSubmit={(code) => {
            setStudioKey(code);
            setCodeTried(true);
            void sampleQuery.refetch();
          }}
        />
      ) : sampleQuery.isError ? (
        <ErrorState message={(sampleQuery.error as Error).message} onRetry={() => sampleQuery.refetch()} />
      ) : !sampleQuery.data?.aiConfigured ? (
        <ErrorState message="שירות ה-AI לא מוגדר בשרת (חסר GEMINI_API_KEY)." />
      ) : items.length === 0 ? (
        <EmptyState title="לא נמצאו כרגע מוצרים ללא תיאור." />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "300px minmax(0, 1fr)" }, gap: { xs: 2, md: 3 }, alignItems: "start" }}>
          <ProductList items={items} generations={generations} appliedIds={appliedIds} selectedId={selectedId} onSelect={setSelectedId} />
          {selected ? (
            <Workspace
              key={selected.id}
              sample={selected}
              generation={generations[selected.id]}
              applied={appliedIds.has(selected.id)}
              onGenerate={() => void generate(selected.id)}
              onRevise={(instruction) => revise(selected.id, instruction)}
              onUndo={() => undo(selected.id)}
              onApply={() => applyDemo([selected.id])}
              onUnapply={() => unapplyDemo(selected.id)}
            />
          ) : null}
        </Box>
      )}

      <ApplyDemoDialog
        open={applyAllOpen}
        names={readyToApply.map((item) => displayName(item.name))}
        onClose={() => setApplyAllOpen(false)}
        onConfirm={() => {
          setApplyAllOpen(false);
          applyDemo(readyToApply.map((item) => item.id));
        }}
      />
    </Container>
  );
}
