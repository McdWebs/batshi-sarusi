import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";

/** Asks the owner for the studio access code. Shown when the server answers 401 to a studio request. */
export function AccessCodeForm({ wrong, onSubmit }: { wrong: boolean; onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim()) onSubmit(code.trim());
      }}
      sx={{ maxWidth: 420, mx: "auto", py: { xs: 4, md: 8 }, display: "grid", gap: 2 }}
    >
      <Typography variant="h5" sx={{ fontFamily: '"Noto Serif Hebrew", serif', fontWeight: 600 }}>
        אזור לבעלת החנות
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: 14 }}>
        הכניסו את קוד הגישה כדי להמשיך. הקוד נשמר רק עד שסוגרים את הלשונית.
      </Typography>
      <TextField
        type="password"
        label="קוד גישה"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoFocus
        autoComplete="off"
        error={wrong}
        helperText={wrong ? "הקוד לא נכון. נסו שוב." : undefined}
        inputProps={{ dir: "ltr" }}
      />
      <Button type="submit" variant="contained" disabled={!code.trim()}>
        כניסה
      </Button>
    </Box>
  );
}
