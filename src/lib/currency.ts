export type SupportedCurrency =
  | "IDR"
  | "USD"
  | "SGD"
  | "MYR"
  | "EUR"
  | "GBP"
  | "JPY";

export const SUPPORTED_CURRENCIES: {
  code: SupportedCurrency;
  name: string;
  symbol: string;
}[] = [
  {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
];

export function isSupportedCurrency(
  value: string | null | undefined
): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.some(
    (currency) => currency.code === value
  );
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits:
      currency === "IDR" || currency === "JPY" ? 0 : 2,
    maximumFractionDigits:
      currency === "IDR" || currency === "JPY" ? 0 : 2,
  }).format(amount);
}