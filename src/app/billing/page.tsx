"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlanStatus from "@/components/PlanStatus";
import { createClient } from "@/lib/supabase/client";

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBillingStatus() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("Unable to load your billing status.");
      }

      setPlan(profile?.plan === "premium" ? "premium" : "free");
      setLoading(false);
    }

    loadBillingStatus();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2E8]">
        <p className="text-[#7B9685]">Loading your billing status...</p>
      </main>
    );
  }

  const isPremium = plan === "premium";

  return (
    <main className="min-h-screen bg-[#F5F2E8] text-[#173C34]">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-4 inline-block text-sm font-semibold text-[#7B9685] transition hover:text-[#214F43]"
            >
              ← Back to Dashboard
            </Link>

            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7B9685]">
              Account billing
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              Billing &amp; Plan
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-[#5F7168]">
              Review your Ordiva access and manage Premium when billing launches.
            </p>
          </div>

          <PlanStatus plan={plan} />
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-8 rounded-[2rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                Current access
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {isPremium ? "Ordiva Premium" : "Ordiva Free"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#7B9685]">
                {isPremium
                  ? "Your account currently has Premium access. Subscription dates and cancellation controls will appear after checkout is connected."
                  : "Track your finances with the core Ordiva experience. Upgrade when you want deeper trends and financial intelligence."}
              </p>
            </div>

            {!isPremium && (
              <Link
                href="/pricing"
                className="rounded-2xl bg-[#214F43] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#173C34]"
              >
                View Premium plans
              </Link>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#DDE6D7] bg-white/55 p-6 md:p-8">
          <p className="text-sm font-semibold">Payment history</p>
          <p className="mt-1 text-sm leading-6 text-[#7B9685]">
            Payment history will appear here after Xendit checkout and server-side payment verification are connected.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-[#C8D8BE] bg-[#F9F8F2]/70 p-5 text-sm text-[#7B9685]">
            No payment records yet.
          </div>
        </section>

        <div className="pb-6 pt-8 text-center">
          <p className="text-xs text-[#7B9685]">Ordiva · Plan Smarter. Live Brighter.</p>
        </div>
      </div>
    </main>
  );
}
