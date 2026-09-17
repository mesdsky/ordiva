export type OrdivaPlan = "free" | "premium";

export function normalizePlan(plan: string | null | undefined): OrdivaPlan {
  return plan === "premium" ? "premium" : "free";
}

export function isPremium(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === "premium";
}

export function isFree(plan: string | null | undefined): boolean {
  return !isPremium(plan);
}

export const PREMIUM_COPY = {
  badge: "Premium",
  title: "Unlock deeper financial insights.",
  description:
    "Go beyond tracking. Get richer trends, comparisons, and intelligence built around your financial data.",
  comingSoon:
    "Ordiva Premium is coming soon. Checkout is not available yet.",
  button: "Got it",
} as const;
