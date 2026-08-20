import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart, useCartMutations } from "../hooks/useCart";
import { useUiStore } from "../store/ui";
import { AnimatedMoney } from "./AnimatedMoney";
import { CartLineItem } from "./CartLineItem";
import { EmptyCart } from "./EmptyCart";
import { ErrorState } from "./States";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUiStore();
  const { data: cart, isError, error, refetch } = useCart();
  const { updateItem, removeItem, coupon } = useCartMutations();
  const [code, setCode] = useState("");
  const empty = !cart?.itemsCount;
  const close = () => setCartOpen(false);

  return (
    <Drawer anchor="left" open={cartOpen} onClose={close} PaperProps={{ "aria-label": "עגלה" }}>
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">עגלה</Typography>
          <IconButton onClick={close}>
            <CloseIcon />
          </IconButton>
        </Box>
        {isError ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
        {empty ? (
          <EmptyCart compact onNavigate={close} />
        ) : (
          <>
            <Box sx={{ flex: 1, overflow: "auto", display: "grid", gap: 1.5, alignContent: "start", pe: 0.25 }}>
              {cart.items.map((item) => (
                <CartLineItem
                  key={item.key}
                  item={item}
                  compact
                  busy={
                    (updateItem.isPending && updateItem.variables?.key === item.key) ||
                    (removeItem.isPending && removeItem.variables === item.key)
                  }
                  onQuantity={(quantity) => updateItem.mutate({ key: item.key, quantity })}
                  onRemove={() => removeItem.mutate(item.key)}
                  onNavigate={close}
                />
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ flexShrink: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                <Typography>ביניים</Typography>
                <AnimatedMoney major={cart.totals.totalItems.major} suffix={cart.totals.currencySuffix} />
              </Box>
              {Number(cart.totals.totalDiscount.minor) > 0 ? (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                  <Typography>הנחה</Typography>
                  <AnimatedMoney
                    major={cart.totals.totalDiscount.major}
                    suffix={cart.totals.currencySuffix}
                    prefix="-"
                  />
                </Box>
              ) : null}
              {cart.totals.totalShipping ? (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                  <Typography>משלוח</Typography>
                  <AnimatedMoney major={cart.totals.totalShipping.major} suffix={cart.totals.currencySuffix} />
                </Box>
              ) : null}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                <Typography fontWeight={700}>סה״כ</Typography>
                <AnimatedMoney
                  major={cart.totals.totalPrice.major}
                  suffix={cart.totals.currencySuffix}
                  fontWeight={700}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "stretch" }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="קוד קופון"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  inputProps={{ style: { textTransform: "uppercase" } }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "100%" } }}
                />
                <Button
                  variant="outlined"
                  onClick={() => code && coupon.mutate(code)}
                  disabled={!code.trim() || coupon.isPending}
                  sx={{ py: 0, minHeight: 40, height: 40, flexShrink: 0 }}
                >
                  החלה
                </Button>
              </Box>
              {coupon.isError ? <ErrorState message={(coupon.error as Error).message} /> : null}
              <Box sx={{ display: "grid", gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/checkout"
                  onClick={close}
                >
                  לתשלום
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  component={Link}
                  to="/cart"
                  onClick={close}
                >
                  לעגלה
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
