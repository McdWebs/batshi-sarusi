import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useCart, useCartMutations } from "../hooks/useCart";
import { AnimatedMoney } from "../components/AnimatedMoney";
import { CartLineItem, CartLineItemSkeleton } from "../components/CartLineItem";
import { ErrorState } from "../components/States";
import { formatMoney } from "../utils/format";

const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

function CartPageSkeleton() {
  return (
    <Container maxWidth="md" sx={{ py: 5 }} aria-busy="true" aria-label="טוען עגלה">
      <Skeleton variant="rectangular" animation="wave" width={120} height={40} sx={{ ...bone, mb: 4 }} />

      <Box sx={{ display: "grid", gap: 1.25 }}>
        <CartLineItemSkeleton />
        <CartLineItemSkeleton />
      </Box>

      <Skeleton
        variant="rectangular"
        animation="wave"
        height={56}
        sx={{ ...bone, mt: 3, borderRadius: 1 }}
      />

      <Box sx={{ display: "flex", gap: 1, mt: 3, alignItems: "stretch" }}>
        <Skeleton variant="rectangular" animation="wave" height={56} sx={{ ...bone, flex: 1, borderRadius: 1 }} />
        <Skeleton variant="rectangular" animation="wave" width={88} height={56} sx={{ ...bone, borderRadius: 1 }} />
      </Box>

      <Box sx={{ mt: 4 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Box
            key={index}
            sx={{ display: "flex", justifyContent: "space-between", py: 0.75, alignItems: "center" }}
          >
            <Skeleton
              variant="rectangular"
              animation="wave"
              height={index === 3 ? 18 : 16}
              width={index === 3 ? 48 : 56}
              sx={bone}
            />
            <Skeleton
              variant="rectangular"
              animation="wave"
              height={index === 3 ? 18 : 16}
              width={index === 3 ? 88 : 72}
              sx={bone}
            />
          </Box>
        ))}
      </Box>

      <Skeleton
        variant="rectangular"
        animation="wave"
        height={48}
        sx={{ ...bone, mt: 3, borderRadius: 1 }}
      />
    </Container>
  );
}

export function CartPage() {
  const cartQuery = useCart();
  const { updateItem, removeItem, coupon, dropCoupon, shipping } =
    useCartMutations();
  const [code, setCode] = useState("");
  const cart = cartQuery.data;

  if (cartQuery.isLoading) {
    return <CartPageSkeleton />;
  }
  if (cartQuery.isError) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <ErrorState
          message={(cartQuery.error as Error).message}
          onRetry={() => cartQuery.refetch()}
        />
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
          <Box sx={{ display: "grid", gap: 1.25 }}>
            {cart.items.map((item) => (
              <CartLineItem
                key={item.key}
                item={item}
                busy={
                  (updateItem.isPending &&
                    updateItem.variables?.key === item.key) ||
                  (removeItem.isPending && removeItem.variables === item.key)
                }
                onQuantity={(quantity) =>
                  updateItem.mutate({ key: item.key, quantity })
                }
                onRemove={() => removeItem.mutate(item.key)}
              />
            ))}
          </Box>

          {cart.shippingRates.map((pkg) => {
            const shippingBusy =
              shipping.isPending && shipping.variables?.packageId === pkg.packageId;
            return (
              <FormControl fullWidth key={pkg.packageId} sx={{ mt: 3 }} disabled={shippingBusy}>
                <InputLabel>{pkg.name || "משלוח"}</InputLabel>
                <Select
                  label={pkg.name || "משלוח"}
                  value={pkg.rates.find((rate) => rate.selected)?.rateId ?? ""}
                  disabled={shippingBusy}
                  onChange={(event) =>
                    shipping.mutate({
                      packageId: pkg.packageId,
                      rateId: event.target.value,
                    })
                  }
                  IconComponent={
                    shippingBusy
                      ? (props) => (
                          <Box
                            component="span"
                            {...props}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "absolute",
                              end: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                            }}
                          >
                            <CircularProgress size={18} aria-label="מעדכן משלוח" />
                          </Box>
                        )
                      : undefined
                  }
                  sx={{
                    opacity: shippingBusy ? 0.72 : 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {pkg.rates.map((rate) => (
                    <MenuItem key={rate.rateId} value={rate.rateId}>
                      {rate.name} · {formatMoney(rate.price.major)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })}

          <Box sx={{ display: "flex", gap: 1, mt: 3, alignItems: "stretch" }}>
            <TextField
              fullWidth
              placeholder="קוד קופון"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { height: "100%" } }}
            />
            <Button
              variant="outlined"
              onClick={() => code && coupon.mutate(code)}
              sx={{ py: 0, alignSelf: "stretch" }}
            >
              החלה
            </Button>
          </Box>
          {cart.coupons.map((entry) => (
            <Box
              key={entry.code}
              sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
            >
              <Typography>{entry.code}</Typography>
              <Button
                size="small"
                onClick={() => dropCoupon.mutate(entry.code)}
              >
                הסרת קופון
              </Button>
            </Box>
          ))}
          {coupon.isError ? (
            <Box mt={2}>
              <ErrorState message={(coupon.error as Error).message} />
            </Box>
          ) : null}

          <Box
            sx={{
              mt: 4,
              opacity: shipping.isPending ? 0.55 : 1,
              transition: "opacity 0.2s ease",
              pointerEvents: shipping.isPending ? "none" : "auto",
            }}
          >
            <Row
              label="ביניים"
              value={
                <AnimatedMoney
                  major={cart.totals.totalItems.major}
                  suffix={cart.totals.currencySuffix}
                />
              }
            />
            <Row
              label="הנחה"
              value={
                <AnimatedMoney
                  major={cart.totals.totalDiscount.major}
                  suffix={cart.totals.currencySuffix}
                />
              }
            />
            <Row
              label="משלוח"
              value={
                cart.totals.totalShipping ? (
                  <AnimatedMoney
                    major={cart.totals.totalShipping.major}
                    suffix={cart.totals.currencySuffix}
                  />
                ) : (
                  "מחושב לפי החנות"
                )
              }
            />
            <Row
              label="סה״כ"
              value={
                <AnimatedMoney
                  major={cart.totals.totalPrice.major}
                  suffix={cart.totals.currencySuffix}
                  fontWeight={700}
                />
              }
              strong
            />
          </Box>
          <Button
            component={Link}
            to="/checkout"
            variant="contained"
            sx={{ mt: 3 }}
            fullWidth
          >
            לתשלום
          </Button>
        </>
      )}
    </Container>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        py: 0.75,
        fontWeight: strong ? 700 : 400,
      }}
    >
      <Typography fontWeight="inherit">{label}</Typography>
      {typeof value === "string" ? (
        <Typography fontWeight="inherit">{value}</Typography>
      ) : (
        value
      )}
    </Box>
  );
}
