"use client";

import { useRouter } from "next/navigation";
import { PREMIUM_COPY } from "@/lib/premium";

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#C8D8BE]/70 bg-[#E8EEDB] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#214F43] ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#214F43]" />
      {PREMIUM_COPY.badge}
    </span>
  );
}

export function PremiumLock({
  title = "Unlock deeper insights.",
  description = PREMIUM_COPY.description,
  children,
  onUpgrade,
  className = "",
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onUpgrade?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[#DDE6D7] bg-white/45 shadow-[0_12px_35px_rgba(23,60,52,0.045)] backdrop-blur-sm ${className}`}
    >
      {children && (
        <div aria-hidden className="pointer-events-none select-none opacity-45 blur-[1.5px]">
          {children}
        </div>
      )}

      <div
        className={`${
          children ? "absolute inset-0" : "relative"
        } flex items-center justify-center bg-[#F5F2E8]/55 p-6 backdrop-blur-[2px]`}
      >
        <div className="max-w-md text-center">
          <PremiumBadge />
          <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-[#173C34]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#7B9685]">
            {description}
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-5 rounded-full bg-[#214F43] px-5 py-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(33,79,67,0.14)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#173C34]"
          >
            {PREMIUM_COPY.button}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PremiumModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#173C34]/35 px-5 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-[#F9F8F2] p-7 shadow-[0_30px_80px_rgba(23,60,52,0.18)] md:p-8">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#AFC1A4]/25 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-5">
            <PremiumBadge />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDE6D7] bg-white/60 text-sm text-[#5F7168] transition-colors hover:bg-white"
            >
              ×
            </button>
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] text-[#173C34]">
            {PREMIUM_COPY.title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#7B9685]">
            {PREMIUM_COPY.description}
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-[#DDE6D7] bg-[#E8EEDB]/55 p-5">
            <p className="text-xs font-semibold text-[#214F43]">
              Explore the plans available for Ordiva Premium.
            </p>
            <p className="mt-1.5 text-xs leading-5 text-[#7B9685]">
              {PREMIUM_COPY.comingSoon}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/pricing");
            }}
            className="mt-6 w-full rounded-full bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#173C34]"
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}
