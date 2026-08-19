import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import { decodeHtmlEntities } from "../utils/format";

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} variant="rectangular" height={index === 0 ? 240 : 28} />
      ))}
    </Box>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {body ? (
        <Typography color="text.secondary" maxWidth={480} mx="auto">
          {body}
        </Typography>
      ) : null}
    </Box>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            נסו שוב
          </Button>
        ) : undefined
      }
    >
      {decodeHtmlEntities(message) || "משהו השתבש. נסו שוב בעוד רגע."}
    </Alert>
  );
}
