import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { ApiError } from "../api/client";
import { track } from "../analytics/tracker";
import { subscribeBackInStock } from "../api/store";

function messageFor(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "VALIDATION_ERROR") return "נא להזין כתובת מייל תקינה.";
    if (error.code === "ALREADY_IN_STOCK") return "המוצר חזר למלאי. רעננו את הדף כדי להזמין אותו.";
    if (error.code === "RATE_LIMITED") return "יותר מדי ניסיונות. נסו שוב בעוד רגע.";
  }
  return "לא הצלחנו לשמור את הבקשה. נסו שוב בעוד רגע.";
}

/** "Tell me when it is back" for a sold-out product. Demo: the signup is saved, no email is sent yet. */
export function BackInStockForm({ productId }: { productId: number }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "already">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setState("sending");
    setError(null);
    try {
      const result = await subscribeBackInStock(productId, email);
      setState(result.alreadySubscribed ? "already" : "done");
      if (!result.alreadySubscribed) track("back_in_stock_signup", { productId });
    } catch (caught) {
      setError(messageFor(caught));
      setState("idle");
    }
  };

  return (
    <Box sx={{ mt: 3, p: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>אזל מהמלאי? נעדכן אותך כשיחזור</Typography>
      {state === "done" || state === "already" ? (
        <Alert severity="success" sx={{ mt: 1 }}>
          {state === "done" ? "נרשמת. נעדכן אותך כשהמוצר יחזור למלאי." : "כבר נרשמת לעדכון על המוצר הזה."}
        </Alert>
      ) : (
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}
        >
          <TextField
            type="email"
            label="המייל שלך"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            size="small"
            sx={{ flex: "1 1 220px" }}
            inputProps={{ dir: "ltr" }}
            error={Boolean(error)}
            helperText={error ?? undefined}
          />
          <Button type="submit" variant="contained" disabled={state === "sending" || !email.trim()}>
            {state === "sending" ? "שומרים…" : "עדכנו אותי"}
          </Button>
        </Box>
      )}
      <Typography sx={{ mt: 1.5, fontSize: 12, color: "text.secondary" }}>
        מצב הדגמה: הבקשה נשמרת ומופיעה ברשימת הביקוש של בעלת החנות, אבל עדיין לא נשלחים מיילים.
      </Typography>
    </Box>
  );
}
