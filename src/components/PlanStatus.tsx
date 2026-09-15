"use client";

import { memo } from "react";
import { normalizePlan } from "@/lib/premium";

function PlanStatus({
  plan,
  className = "",
}: {
  plan: string | null | undefined;
  className?: string;
}) {
  const currentPlan = normalizePlan(plan);
  const isPremium = currentPlan === "premium";

  return (
    <div
      aria-label={`Current plan: ${isPremium ? "Premium" : "Free"}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
        isPremium
          ? "border-[#C8D8BE] bg-[#E8EEDB] text-[#214F43]"
          : "border-[#DDE6D7] bg-white/70 text-[#5F7168]"
      } ${className}`}
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] opacity-70">
        Current plan
      </span>
      <span className="text-xs font-bold">
        {isPremium ? "Premium ✦" : "Free"}
      </span>
    </div>
  );
}

export default memo(PlanStatus);
