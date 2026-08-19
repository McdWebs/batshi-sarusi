import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart, useCartMutations } from "../hooks/useCart";
import { CartLineItem } from "../components/CartLineItem";
import { ErrorState, LoadingState } from "../components/States";
import { formatMoney } from "../utils/format";

export function CartPage() {
  const cartQuery = useCart();
  const { updateItem, removeItem, coupon, dropCoupon, shipping } = useCartMutations();
  const [code, setCode] = useState("");
  const cart = cartQuery.data;

  if (cartQuery.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <LoadingState />
      </Container>
    );
  }
  if (cartQuery.isError) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <ErrorState message={(cartQuery.error as Error).message} onRetry={() => cartQuery.refetch()} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h3" mb={4}>
        עגלה
      </Typography>
      {!cart?.itemsCount ? (
        <Box>
          <Typography mb={2}>העגלה שלך ריקה.</Typography>
          <Button component={Link} to="/shop" variant="contained">
            חזרה לחנות
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {cart.items.map((item) => (
              <CartLineItem
                key={item.key}
                item={item}
                busy={updateItem.isPending || removeItem.isPending}
                onQuantity={(quantity) => updateItem.mutate({ key: item.key, quantity })}
                onRemove={() => removeItem.mutate(item.key)}
              />
            ))}
          </Box>

          {cart.shippingRates.map((pkg) => (
            <FormControl fullWidth key={pkg.packageId} sx={{ mt: 3 }}>
              <InputLabel>{pkg.name || "משלוח"}</InputLabel>
              <Select
                label={pkg.name || "משלוח"}
                value={pkg.rates.find((rate) => rate.selected)?.rateId ?? ""}
                onChange={(event) => shipping.mutate({ packageId: pkg.packageId, rateId: event.target.value })}
              >
                {pkg.rates.map((rate) => (
                  <MenuItem key={rate.rateId} value={rate.rateId}>
                    {rate.name} · {formatMoney(rate.price.major)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          <Box sx={{ display: "flex", gap: 1, mt: 3, alignItems: "stretch" }}>
            <TextField
              fullWidth
              placeholder="קוד קופון"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { height: "100%" } }}
            />
            <Button variant="outlined" onClick={() => code && coupon.mutate(code)} sx={{ py: 0, alignSelf: "stretch" }}>
              החלה
            </Button>
          </Box>
          {cart.coupons.map((entry) => (
            <Box key={entry.code} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography>{entry.code}</Typography>
              <Button size="small" onClick={() => dropCoupon.mutate(entry.code)}>
                הסרת קופון
              </Button>
            </Box>
          ))}
          {coupon.isError ? <Box mt={2}><ErrorState message={(coupon.error as Error).message} /></Box> : null}

          <Box sx={{ mt: 4 }}>
            <Row label="ביניים" value={formatMoney(cart.totals.totalItems.major, cart.totals.currencySuffix)} />
            <Row label="הנחה" value={formatMoney(cart.totals.totalDiscount.major, cart.totals.currencySuffix)} />
            <Row
              label="משלוח"
              value={cart.totals.totalShipping ? formatMoney(cart.totals.totalShipping.major, cart.totals.currencySuffix) : "מחושב לפי החנות"}
            />
            <Row label="סה״כ" value={formatMoney(cart.totals.totalPrice.major, cart.totals.currencySuffix)} strong />
          </Box>
          <Button component={Link} to="/checkout" variant="contained" sx={{ mt: 3 }} fullWidth>
            לתשלום
          </Button>
          <Typography color="text.secondary" mt={2}>
            התשלום עדיין לא מחובר לחנות החדשה. העגלה עצמה חיה ב־WooCommerce.
          </Typography>
        </>
      )}
    </Container>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75, fontWeight: strong ? 700 : 400 }}>
      <Typography fontWeight="inherit">{label}</Typography>
      <Typography fontWeight="inherit">{value}</Typography>
    </Box>
  );
}
