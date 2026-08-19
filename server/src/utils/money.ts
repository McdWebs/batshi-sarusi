export type Money = {
  minor: string;
  major: string;
};

export type CurrencyFormat = {
  currencyCode: string;
  currencySymbol: string;
  currencyMinorUnit: number;
  currencyDecimalSeparator: string;
  currencyThousandSeparator: string;
  currencyPrefix: string;
  currencySuffix: string;
};

export type PricedAmount = CurrencyFormat & {
  price: Money;
  regularPrice: Money;
  salePrice: Money;
  priceRange: { minAmount: Money; maxAmount: Money } | null;
};

export function minorToMajor(minor: string | number | null | undefined, minorUnit: number): string {
  const unit = Number.isFinite(minorUnit) && minorUnit >= 0 ? minorUnit : 0;
  const raw = String(minor ?? "0").trim();
  const negative = raw.startsWith("-");
  const digits = (negative ? raw.slice(1) : raw).replace(/[^\d]/g, "") || "0";
  const padded = digits.padStart(unit + 1, "0");
  if (unit === 0) {
    return `${negative ? "-" : ""}${padded.replace(/^0+(?=\d)/, "")}`;
  }
  const whole = padded.slice(0, -unit).replace(/^0+(?=\d)/, "");
  const fraction = padded.slice(-unit);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function toMoney(minor: string | number | null | undefined, minorUnit: number): Money {
  const value = minor == null ? "0" : String(minor);
  return {
    minor: value,
    major: minorToMajor(value, minorUnit),
  };
}

export function readCurrencyFormat(input: {
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
}): CurrencyFormat {
  return {
    currencyCode: input.currency_code ?? "",
    currencySymbol: input.currency_symbol ?? "",
    currencyMinorUnit: input.currency_minor_unit ?? 0,
    currencyDecimalSeparator: input.currency_decimal_separator ?? ".",
    currencyThousandSeparator: input.currency_thousand_separator ?? ",",
    currencyPrefix: input.currency_prefix ?? "",
    currencySuffix: input.currency_suffix ?? "",
  };
}

export function toPricedAmount(input: {
  price?: string | number | null;
  regular_price?: string | number | null;
  sale_price?: string | number | null;
  price_range?: { min_amount?: string | number | null; max_amount?: string | number | null } | null;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
} | null | undefined): PricedAmount | null {
  if (!input) {
    return null;
  }
  const format = readCurrencyFormat(input);
  const unit = format.currencyMinorUnit;
  const range = input.price_range
    ? {
        minAmount: toMoney(input.price_range.min_amount, unit),
        maxAmount: toMoney(input.price_range.max_amount, unit),
      }
    : null;
  return {
    ...format,
    price: toMoney(input.price, unit),
    regularPrice: toMoney(input.regular_price, unit),
    salePrice: toMoney(input.sale_price, unit),
    priceRange: range,
  };
}
