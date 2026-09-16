"use client";

import { useState } from "react";

type PlanId = "monthly" | "three-months" | "yearly" | "lifetime";

export default function PricingCheckoutButton({
  planId,
  selected,
  onSelect,
}: {
  planId: PlanId;
  selected: boolean;
  onSelect: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    onSelect();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.checkoutUrl) {
        throw new Error(body?.error || "Unable to start checkout.");
      }

      window.location.assign(body.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-7">
      <button
        type="button"
        aria-pressed={selected}
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
          selected
            ? "bg-[#214F43] text-white hover:bg-[#173C34]"
            : "border border-[#DDE6D7] bg-[#F9F8F2] text-[#214F43] hover:bg-[#E8EEDB]"
        }`}
      >
        {loading ? "Opening secure checkout..." : selected ? "Continue to checkout" : "Choose plan"}
      </button>
      {error && <p className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
    </div>
  );
}
