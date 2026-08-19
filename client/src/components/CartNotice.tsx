import { Alert, Button, Snackbar } from "@mui/material";
import { useEffect } from "react";
import { useUiStore } from "../store/ui";

export function CartNotice() {
  const notice = useUiStore((state) => state.notice);
  const setNotice = useUiStore((state) => state.setNotice);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const addedProductId = useUiStore((state) => state.addedProductId);
  const setAddedProductId = useUiStore((state) => state.setAddedProductId);

  useEffect(() => {
    if (!addedProductId) return;
    const timer = window.setTimeout(() => setAddedProductId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [addedProductId, setAddedProductId]);

  return (
    <Snackbar
      open={Boolean(notice)}
      autoHideDuration={4000}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        setNotice(null);
        if (addedProductId) setAddedProductId(null);
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ zIndex: 2000 }}
    >
      {notice ? (
        <Alert
          onClose={() => {
            setNotice(null);
            if (addedProductId) setAddedProductId(null);
          }}
          severity={notice.severity}
          variant="filled"
          sx={{ width: "100%", alignItems: "center" }}
          action={
            notice.severity === "success" ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setCartOpen(true);
                  setNotice(null);
                }}
              >
                לעגלה
              </Button>
            ) : undefined
          }
        >
          {notice.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
