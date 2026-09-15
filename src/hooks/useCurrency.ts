"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  isSupportedCurrency,
  SupportedCurrency,
} from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";

export function useCurrency() {
  const [currency, setCurrency] =
    useState<SupportedCurrency>("IDR");

  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrency() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .maybeSingle();

      const selectedCurrency =
        isSupportedCurrency(data?.currency)
          ? data.currency
          : "IDR";

      setCurrency(selectedCurrency);

      if (selectedCurrency === "IDR") {
        setRate(1);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/currency?target=${selectedCurrency}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load currency rate"
          );
        }

        const result = await response.json();

        if (Number.isFinite(result.rate)) {
          setRate(Number(result.rate));
        }
      } catch (error) {
        console.error(
          "Failed to load currency rate:",
          error
        );

        setRate(1);
      }

      setLoading(false);
    }

    loadCurrency();
  }, []);

  const convert = useCallback(
    (amount: number) => amount * rate,
    [rate]
  );

  const format = useCallback(
    (amount: number) =>
      formatCurrency(convert(amount), currency),
    [convert, currency]
  );

  return useMemo(
    () => ({
      currency,
      rate,
      loading,
      convert,
      format,
    }),
    [currency, rate, loading, convert, format]
  );
}