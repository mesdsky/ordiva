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
    "Premium is coming soon. You’ll be able to unlock this feature once Ordiva Premium launches.",
  button: "Premium coming soon",
} as const;
