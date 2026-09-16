"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlanStatus from "@/components/PlanStatus";
import { createClient } from "@/lib/supabase/client";

type Plan = "free" | "premium";
type BillingOrder = { id: string; plan_id: string; amount: number; currency: string; status: string; checkout_url: string | null; created_at: string; paid_at: string | null };
type Entitlement = { id: string; plan_id: string; status: string; starts_at: string; ends_at: string | null; provider_subscription_id: string | null };
type BillingSubscription = { id: string; plan_id: string; status: string; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; cancelled_at: string | null };

type BillingData = { orders: BillingOrder[]; entitlements: Entitlement[]; subscriptions: BillingSubscription[] };

function formatIDR(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function labelForPlan(value: string) {
  if (value === "three-months") return "3 Months";
  if (value === "monthly") return "Monthly";
  if (value === "yearly") return "Yearly";
  if (value === "lifetime") return "Lifetime";
  return value;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>("free");
  const [billing, setBilling] = useState<BillingData>({ orders: [], entitlements: [], subscriptions: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBilling() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const [{ data: profile, error: profileError }, billingResponse] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
        fetch("/api/billing/me", { cache: "no-store" }),
      ]);

      if (profileError) setError("Unable to load your billing status.");
      setPlan(profile?.plan === "premium" ? "premium" : "free");

      const body = await billingResponse.json().catch(() => null);
      if (!billingResponse.ok) setError(body?.error || "Unable to load billing details.");
      else setBilling(body);
      setLoading(false);
    }
    loadBilling();
  }, [router]);

  const activeEntitlement = useMemo(() => {
    return [...billing.entitlements]
      .filter((item) => String(item.status).toLowerCase() === "active")
      .filter((item) => {
        if (!item.ends_at) return true;
        const endTime = new Date(item.ends_at).getTime();
        return Number.isNaN(endTime) || endTime > Date.now();
      })
      .sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
      )[0] ?? null;
  }, [billing.entitlements]);
  const subscription = billing.subscriptions[0] ?? null;
  const isPremium = plan === "premium";

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#F5F2E8]"><p className="text-[#7B9685]">Loading your billing status...</p></main>;

  return (
    <main className="min-h-screen bg-[#F5F2E8] text-[#173C34]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 md:px-12 md:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link href="/dashboard" className="mb-4 inline-block text-sm font-semibold text-[#7B9685] transition hover:text-[#214F43]">← Back to Dashboard</Link>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7B9685]">Account billing</p>
            <h1 className="mt-2 break-words text-4xl font-bold tracking-tight md:text-5xl">Billing &amp; Plan</h1>
            <p className="mt-3 max-w-2xl text-lg text-[#5F7168]">Review your Ordiva access, payments, and Premium entitlement.</p>
          </div>
          <PlanStatus plan={plan} />
        </div>

        {error && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

        <section className="mt-8 rounded-[2rem] border border-[#DDE6D7] bg-white/70 p-5 shadow-sm sm:p-6 md:p-8">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">Current access</p>
              <h2 className="mt-3 break-words text-3xl font-semibold tracking-[-0.04em]">{isPremium ? "Ordiva Premium" : "Ordiva Free"}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#7B9685]">{isPremium ? "Your account has Premium access. The webhook-confirmed entitlement below is the source of truth for billing access." : "Track your finances with the core Ordiva experience. Upgrade when you want deeper trends and financial intelligence."}</p>
            </div>
            {!isPremium && <Link href="/pricing" className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-[#214F43] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#173C34] sm:w-auto">View Premium plans</Link>}
          </div>

          {activeEntitlement && (
            <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-3">
              <BillingMetric label="Entitlement" value={labelForPlan(activeEntitlement.plan_id)} />
              <BillingMetric label="Started" value={formatDate(activeEntitlement.starts_at)} />
              <BillingMetric label="Valid through" value={activeEntitlement.ends_at ? formatDate(activeEntitlement.ends_at) : "Lifetime / active"} />
            </div>
          )}
        </section>

        {subscription && (
          <section className="mt-6 rounded-[2rem] border border-[#DDE6D7] bg-white/55 p-5 sm:p-6 md:p-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><p className="text-sm font-semibold">Subscription status</p><p className="mt-1 text-sm leading-6 text-[#7B9685]">Your recurring Premium subscription is managed through Xendit.</p></div>
              <span className="inline-flex w-fit shrink-0 rounded-full bg-[#E8EEDB] px-3 py-1 text-xs font-semibold text-[#214F43]">{subscription.cancel_at_period_end ? "Cancels at period end" : subscription.status}</span>
            </div>
            <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2"><BillingMetric label="Current period" value={`${formatDate(subscription.current_period_start)} – ${formatDate(subscription.current_period_end)}`} /><BillingMetric label="Cancellation" value={subscription.cancelled_at ? formatDate(subscription.cancelled_at) : subscription.cancel_at_period_end ? "Scheduled" : "Not scheduled"} /></div>
          </section>
        )}

        <section className="mt-6 rounded-[2rem] border border-[#DDE6D7] bg-white/55 p-5 sm:p-6 md:p-8">
          <p className="text-sm font-semibold">Payment history</p>
          <p className="mt-1 text-sm leading-6 text-[#7B9685]">Payments are shown after Xendit confirms them through the server webhook.</p>
          {billing.orders.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-[#C8D8BE] bg-[#F9F8F2]/70 p-5 text-sm text-[#7B9685]">No payment records yet.</div> : <div className="mt-6 space-y-3">{billing.orders.map((order) => <div key={order.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#DDE6D7] bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#214F43]">{labelForPlan(order.plan_id)}</p><p className="mt-1 text-xs text-[#7B9685]">{formatDate(order.paid_at || order.created_at)}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className="rounded-full bg-[#E8EEDB] px-2.5 py-1 text-[10px] font-semibold uppercase text-[#214F43]">{order.status}</span><p className="shrink-0 text-sm font-bold">{formatIDR(order.amount, order.currency)}</p></div></div>)}</div>}
        </section>

        <div className="pb-6 pt-8 text-center"><p className="text-xs text-[#7B9685]">Ordiva · Plan Smarter. Live Brighter.</p></div>
      </div>
    </main>
  );
}

function BillingMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2]/75 p-4"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7B9685]">{label}</p><p className="mt-2 break-words text-sm font-bold text-[#214F43]">{value}</p></div>;
}
