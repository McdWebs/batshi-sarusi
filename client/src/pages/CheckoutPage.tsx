import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import type { Address, Cart } from "../api/types";
import { AnimatedMoney } from "../components/AnimatedMoney";
import { ErrorState } from "../components/States";
import { ProductImagePlaceholder } from "../components/ProductImagePlaceholder";
import { StoreImage } from "../components/StoreImage";
import { ISRAEL_CITIES } from "../data/israelCities";
import { useCart, useCartMutations } from "../hooks/useCart";
import { formatMoney, productPathFromPermalink } from "../utils/format";

const bone = { bgcolor: "#EDE4D6", transform: "none" } as const;

const emptyAddress = (): Address => ({
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postcode: "",
  country: "IL",
  phone: "",
  email: "",
});

function paymentLabel(methodId: string) {
  if (methodId === "grow-wallet-payment") return "תשלום מאובטח (Grow)";
  if (methodId.includes("meshulam")) return "Meshulam";
  if (methodId.includes("bit")) return "bit";
  return methodId;
}

function CheckoutSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }} aria-busy="true" aria-label="טוען תשלום">
      <Skeleton variant="rectangular" animation="wave" width={140} height={40} sx={{ ...bone, mb: 4 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
          gap: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Skeleton variant="rectangular" animation="wave" height={28} width={120} sx={bone} />
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} variant="rectangular" animation="wave" height={56} sx={{ ...bone, borderRadius: 1 }} />
          ))}
        </Box>
        <Skeleton variant="rectangular" animation="wave" height={420} sx={{ ...bone, borderRadius: 2 }} />
      </Box>
    </Container>
  );
}

export function CheckoutPage() {
  const cartQuery = useCart();
  const { coupon, dropCoupon, shipping } = useCartMutations();
  const cart = cartQuery.data;

  const [billing, setBilling] = useState<Address>(emptyAddress);
  const [shippingAddr, setShippingAddr] = useState<Address>(emptyAddress);
  const [shipElsewhere, setShipElsewhere] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!cart || hydrated) return;
    setBilling({
      ...emptyAddress(),
      ...cart.billingAddress,
      country: cart.billingAddress.country || "IL",
      email: cart.billingAddress.email ?? "",
    });
    setShippingAddr({
      ...emptyAddress(),
      ...cart.shippingAddress,
      country: cart.shippingAddress.country || "IL",
    });
    setHydrated(true);
  }, [cart, hydrated]);

  if (cartQuery.isLoading) return <CheckoutSkeleton />;

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

  if (!cart?.itemsCount) {
    return <Navigate to="/cart" replace />;
  }

  const paymentIds =
    cart.paymentMethodIds && cart.paymentMethodIds.length > 0
      ? cart.paymentMethodIds
      : ["grow-wallet-payment"];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
      <Typography variant="h3" mb={{ xs: 3, md: 4 }}>
        תשלום
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
          gap: { xs: 4, md: 5 },
          alignItems: "start",
        }}
      >
        <Box component="form" noValidate onSubmit={(e) => e.preventDefault()} sx={{ display: "grid", gap: 3 }}>
          <SectionTitle>פרטי חיוב</SectionTitle>
          <AddressFields value={billing} onChange={setBilling} includeEmail />

          {cart.needsShipping ? (
            <>
              <FormControlLabel
                sx={{ alignItems: "center", mr: 0 }}
                control={
                  <Checkbox
                    checked={shipElsewhere}
                    onChange={(_, checked) => setShipElsewhere(checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">לשלוח לכתובת אחרת?</Typography>}
              />

              {shipElsewhere ? (
                <Box sx={{ display: "grid", gap: 2 }}>
                  <SectionTitle>פרטי משלוח</SectionTitle>
                  <AddressFields value={shippingAddr} onChange={setShippingAddr} />
                </Box>
              ) : null}
            </>
          ) : null}

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <SectionTitle>הערות להזמנה</SectionTitle>
            <TextField
              label="הערות להזמנה (אופציונלי)"
              placeholder="הערות להזמנה, למשל הערות מיוחדות למשלוח."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              size="small"
            />
          </Box>
        </Box>

        <Box
          sx={{
            position: { md: "sticky" },
            top: { md: 88 },
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 2,
            p: { xs: 2.5, sm: 3 },
            display: "grid",
            gap: 2.5,
          }}
        >
          <SectionTitle>ההזמנה שלך</SectionTitle>

          <Box sx={{ display: "grid", gap: 1.5 }}>
            {cart.items.map((item) => (
              <OrderLine key={item.key} item={item} suffix={cart.totals.currencySuffix} />
            ))}
          </Box>

          <Box>
            <Button
              variant="text"
              size="small"
              onClick={() => setCouponOpen((open) => !open)}
              sx={{ px: 0, minWidth: 0, color: "secondary.main" }}
            >
              יש לך קוד קופון?
            </Button>
            {couponOpen ? (
              <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "stretch" }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="קוד קופון"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
                <Button
                  variant="outlined"
                  disabled={!couponCode.trim() || coupon.isPending}
                  onClick={() => couponCode && coupon.mutate(couponCode)}
                >
                  החלה
                </Button>
              </Box>
            ) : null}
            {cart.coupons.map((entry) => (
              <Box
                key={entry.code}
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}
              >
                <Typography variant="body2">{entry.code}</Typography>
                <Button size="small" onClick={() => dropCoupon.mutate(entry.code)}>
                  הסרת קופון
                </Button>
              </Box>
            ))}
            {coupon.isError ? (
              <Box mt={1}>
                <ErrorState message={(coupon.error as Error).message} />
              </Box>
            ) : null}
          </Box>

          {cart.shippingRates.map((pkg) => {
            const shippingBusy =
              shipping.isPending && shipping.variables?.packageId === pkg.packageId;
            return (
              <FormControl fullWidth key={pkg.packageId} size="small" disabled={shippingBusy}>
                <InputLabel>{pkg.name || "שיטת משלוח"}</InputLabel>
                <Select
                  label={pkg.name || "שיטת משלוח"}
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
                    "& .MuiSelect-select": {
                      whiteSpace: "normal",
                      textOverflow: "clip",
                      overflow: "hidden",
                      lineHeight: 1.35,
                      py: 1.25,
                      minHeight: "1.4375em",
                      height: "auto",
                    },
                  }}
                >
                  {pkg.rates.map((rate) => (
                    <MenuItem
                      key={rate.rateId}
                      value={rate.rateId}
                      sx={{ whiteSpace: "normal", alignItems: "flex-start", lineHeight: 1.35 }}
                    >
                      {rate.name} · {formatMoney(rate.price.major)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })}

          <Box
            sx={{
              opacity: shipping.isPending ? 0.55 : 1,
              transition: "opacity 0.2s ease",
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 1.5,
            }}
          >
            <TotalsRow
              label="ביניים"
              value={
                <AnimatedMoney
                  major={cart.totals.totalItems.major}
                  suffix={cart.totals.currencySuffix}
                />
              }
            />
            <TotalsRow
              label="הנחה"
              value={
                <AnimatedMoney
                  major={cart.totals.totalDiscount.major}
                  suffix={cart.totals.currencySuffix}
                />
              }
            />
            <TotalsRow
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
            <TotalsRow
              label="סה״כ"
              strong
              value={
                <AnimatedMoney
                  major={cart.totals.totalPrice.major}
                  suffix={cart.totals.currencySuffix}
                  fontWeight={700}
                />
              }
            />
          </Box>

          <Box sx={{ display: "grid", gap: 1.25 }}>
            <SectionTitle>שיטת תשלום</SectionTitle>
            <RadioGroup value={paymentIds[0]} name="payment-method">
              {paymentIds.map((id) => (
                <Box
                  key={id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.75,
                    mb: 1,
                  }}
                >
                  <FormControlLabel
                    value={id}
                    control={<Radio size="small" checked />}
                    label={
                      <Typography variant="body2" fontWeight={600}>
                        {paymentLabel(id)}
                      </Typography>
                    }
                    sx={{ mr: 0, width: "100%" }}
                  />
                </Box>
              ))}
            </RadioGroup>
            <Alert severity="info" sx={{ bgcolor: "rgba(143, 61, 42, 0.06)", color: "text.primary" }}>
              פרטי התשלום יופיעו כאן בהמשך — כרגע מוצג רק ממשק הדף, ללא חיוב.
            </Alert>
          </Box>

          <Button variant="contained" fullWidth size="large" disabled>
            ביצוע הזמנה
          </Button>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            ביצוע ההזמנה והתשלום יחוברו בשלב הבא.{" "}
            <Box component={RouterLink} to="/cart" sx={{ color: "secondary.main" }}>
              חזרה לעגלה
            </Box>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="h6"
      sx={{
        fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif',
        fontWeight: 600,
        fontSize: { xs: 18, md: 20 },
      }}
    >
      {children}
    </Typography>
  );
}

function AddressFields({
  value,
  onChange,
  includeEmail,
}: {
  value: Address;
  onChange: (next: Address) => void;
  includeEmail?: boolean;
}) {
  const set =
    (key: keyof Address) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...value, [key]: event.target.value });
    };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "1fr 1fr" } }}>
        <TextField
          label="שם פרטי"
          required
          size="small"
          fullWidth
          value={value.firstName}
          onChange={set("firstName")}
          autoComplete="given-name"
        />
        <TextField
          label="שם משפחה"
          required
          size="small"
          fullWidth
          value={value.lastName}
          onChange={set("lastName")}
          autoComplete="family-name"
        />
      </Box>

      <TextField
        label="שם החברה"
        size="small"
        fullWidth
        value={value.company}
        onChange={set("company")}
        autoComplete="organization"
      />

      <FormControl fullWidth size="small" required>
        <InputLabel>מדינה / אזור</InputLabel>
        <Select
          label="מדינה / אזור"
          value={value.country || "IL"}
          onChange={(event) => onChange({ ...value, country: event.target.value })}
        >
          <MenuItem value="IL">ישראל</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="כתובת רחוב"
        placeholder="מספר בית ושם רחוב"
        required
        size="small"
        fullWidth
        value={value.address1}
        onChange={set("address1")}
        autoComplete="address-line1"
      />

      <TextField
        label="דירה, סוויטה, יחידה וכו' (אופציונלי)"
        size="small"
        fullWidth
        value={value.address2}
        onChange={set("address2")}
        autoComplete="address-line2"
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "1fr 1fr" } }}>
        <TextField
          label="מיקוד / תא דואר"
          required
          size="small"
          fullWidth
          value={value.postcode}
          onChange={set("postcode")}
          autoComplete="postal-code"
        />
        <CitySelect
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
        />
      </Box>

      <TextField
        label="טלפון"
        type="tel"
        required
        size="small"
        fullWidth
        value={value.phone}
        onChange={set("phone")}
        autoComplete="tel"
      />

      {includeEmail ? (
        <TextField
          label="כתובת אימייל"
          type="email"
          required
          size="small"
          fullWidth
          value={value.email ?? ""}
          onChange={set("email")}
          autoComplete="email"
        />
      ) : null}
    </Box>
  );
}

function CitySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (city: string) => void;
}) {
  const options = useMemo(() => {
    const list = [...ISRAEL_CITIES] as string[];
    if (value && !list.includes(value)) list.unshift(value);
    return list;
  }, [value]);

  return (
    <Autocomplete
      options={options}
      value={value || null}
      onChange={(_event, next) => onChange(next ?? "")}
      autoHighlight
      openOnFocus
      fullWidth
      size="small"
      noOptionsText="לא נמצאה עיר"
      renderInput={(params) => (
        <TextField
          {...params}
          label="עיר"
          required
          autoComplete="address-level2"
        />
      )}
      slotProps={{
        popper: {
          sx: {
            "& .MuiAutocomplete-listbox": {
              maxHeight: 280,
            },
          },
        },
      }}
    />
  );
}

function OrderLine({
  item,
  suffix,
}: {
  item: Cart["items"][number];
  suffix: string;
}) {
  const href = productPathFromPermalink(item.permalink);
  const image = item.images[0];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "56px 1fr auto",
        gap: 1.25,
        alignItems: "center",
      }}
    >
      <Box
        component={RouterLink}
        to={href}
        sx={{
          width: 56,
          height: 56,
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          display: "block",
        }}
      >
        {image?.src ? (
          <StoreImage src={image.src} alt={image.alt || item.name} />
        ) : (
          <ProductImagePlaceholder />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component={RouterLink}
          to={href}
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "inherit",
            textDecoration: "none",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            "&:hover": { color: "secondary.main" },
          }}
        >
          {item.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          × {item.quantity}
        </Typography>
      </Box>
      <AnimatedMoney major={item.totals.totalPrice.major} suffix={suffix} fontSize={14} />
    </Box>
  );
}

function TotalsRow({
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
        py: 0.6,
        fontWeight: strong ? 700 : 400,
      }}
    >
      <Typography fontWeight="inherit" fontSize={strong ? 16 : 14}>
        {label}
      </Typography>
      {typeof value === "string" ? (
        <Typography fontWeight="inherit" fontSize={strong ? 16 : 14}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Box>
  );
}
