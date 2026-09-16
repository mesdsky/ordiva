"use client";

import Link from "next/link";
import { useState } from "react";
import { PremiumBadge } from "@/components/Premium";

type PlanId = "monthly" | "three-months" | "yearly" | "lifetime";

type Plan = {
  id: PlanId;
  label: string;
  price: number;
  period: string;
  description: string;
  months?: number;
  best?: boolean;
};

const plans: Plan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: 29000,
    period: "/ month",
    description: "Flexible access with no long-term commitment.",
  },
  {
    id: "three-months",
    label: "3 Months",
    price: 49000,
    period: "/ 3 months",
    description: "A lighter commitment with more room to plan.",
    months: 3,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: 108000,
    period: "/ year",
    description: "The best value for building a consistent habit.",
    months: 12,
    best: true,
  },
  {
    id: "lifetime",
    label: "Lifetime",
    price: 249000,
    period: "one-time",
    description: "Pay once and keep your Premium insight layer.",
  },
];

const benefits = [
  "12-month financial trends and comparisons",
  "Full category analysis and spending patterns",
  "Financial health score and richer insights",
  "A calmer, clearer view of your financial direction",
];

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("yearly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const selected = plans.find((plan) => plan.id === selectedPlan) ?? plans[2];

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selected.id }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.checkoutUrl) {
        throw new Error(body?.error || "Unable to start checkout.");
      }

      window.location.assign(body.checkoutUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Unable to start checkout."
      );
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F2E8] text-[#173C34]">
      <section className="relative overflow-hidden border-b border-[#DDE6D7] bg-[linear-gradient(180deg,#DDE8D8_0%,#E5ECDF_28%,#EEF0E7_58%,#F5F2E8_100%)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#AFC1A4]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/45 blur-3xl" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:px-12 md:pb-24 md:pt-10">
          <div className="flex min-w-0 items-center justify-between gap-5">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-[#5F7168] transition hover:text-[#214F43]"
            >
              ← Back to Dashboard
            </Link>
            <PremiumBadge />
          </div>

          <div className="mx-auto mt-16 max-w-3xl text-center md:mt-20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7B9685]">
              Ordiva Premium
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#173C34] sm:text-5xl md:text-7xl">
              A clearer view of your money.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#5F7168] md:text-lg">
              Go beyond tracking with richer trends, comparisons, and financial intelligence built around your data.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:px-12 md:py-16">
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <article
                key={plan.id}
                className={`relative flex min-w-0 max-w-full flex-col rounded-[2rem] border p-6 transition-[transform,box-shadow,background-color] duration-200 md:p-7 ${
                  isSelected
                    ? "border-[#214F43] bg-white shadow-[0_22px_60px_rgba(33,79,67,0.12)] md:-translate-y-1"
                    : "border-[#DDE6D7] bg-white/55 shadow-[0_12px_35px_rgba(23,60,52,0.045)] hover:-translate-y-0.5 hover:bg-white/75"
                }`}
              >
                {plan.best && (
                  <span className="absolute right-5 top-5 rounded-full bg-[#E8EEDB] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#214F43]">
                    Best value
                  </span>
                )}
                <p className="text-sm font-semibold text-[#214F43]">{plan.label}</p>
                <p className="mt-6 break-words text-3xl font-bold tracking-[-0.04em] text-[#173C34]">
                  {formatIDR(plan.price)}
                </p>
                <p className="mt-1 text-xs font-medium text-[#7B9685]">{plan.period}</p>

                {plan.months && (
                  <div className="mt-4 rounded-xl bg-[#E8EEDB]/65 px-3 py-2">
                    <p className="text-xs font-semibold text-[#214F43]">
                      ≈ {formatIDR(plan.price / plan.months)} / month
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-[#5F7168]">
                      Save {formatIDR(29000 * plan.months - plan.price)}{" "}
                      ({Math.round((1 - plan.price / (29000 * plan.months)) * 100)}% vs monthly)
                    </p>
                  </div>
                )}

                <p className="mt-5 min-h-12 text-sm leading-6 text-[#5F7168]">{plan.description}</p>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`mt-7 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-[#214F43] text-white hover:bg-[#173C34]"
                      : "border border-[#DDE6D7] bg-[#F9F8F2] text-[#214F43] hover:bg-[#E8EEDB]"
                  }`}
                >
                  {isSelected ? "Selected plan" : "Choose plan"}
                </button>
              </article>
            );
          })}
        </div>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="min-w-0 rounded-[2rem] border border-[#DDE6D7] bg-white/55 p-6 shadow-[0_12px_35px_rgba(23,60,52,0.045)] sm:p-7 md:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7B9685]">What you unlock</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#173C34] md:text-3xl">More context. Less guesswork.</h2>
            <div className="mt-7 grid min-w-0 gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex min-w-0 gap-3 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2]/75 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8EEDB] text-sm font-bold text-[#214F43]">✓</span>
                  <p className="min-w-0 break-words text-sm leading-6 text-[#5F7168]">{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-[2rem] bg-[#214F43] p-6 text-white shadow-[0_25px_70px_rgba(33,79,67,0.12)] sm:p-7 md:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Your selection</p>
            <h2 className="mt-4 break-words text-3xl font-semibold tracking-[-0.04em]">{selected.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">{selected.description}</p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs text-white/50">Selected price</p>
              <p className="mt-2 break-words text-2xl font-bold text-[#C8D8BE]">{formatIDR(selected.price)}</p>
              <p className="mt-1 text-xs text-white/45">{selected.period}</p>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="mt-7 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-[#214F43] transition hover:bg-[#E8EEDB] disabled:cursor-wait disabled:opacity-60"
            >
              {checkoutLoading ? "Opening secure checkout..." : "Continue to checkout"}
            </button>
            {checkoutError && <p className="mt-3 break-words text-center text-xs leading-5 text-[#F9C4C4]">{checkoutError}</p>}
            <p className="mt-4 text-center text-xs leading-5 text-white/40">Secure checkout is handled by Xendit.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
