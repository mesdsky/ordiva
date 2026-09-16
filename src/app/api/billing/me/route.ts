import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [orders, entitlements, subscriptions] = await Promise.all([
    supabase.from("billing_orders").select("id, plan_id, amount, currency, status, checkout_url, created_at, paid_at").order("created_at", { ascending: false }).limit(25),
    supabase.from("billing_entitlements").select("id, plan_id, status, starts_at, ends_at, provider_subscription_id").order("created_at", { ascending: false }),
    supabase.from("billing_subscriptions").select("id, plan_id, provider_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end, cancelled_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const error = orders.error ?? entitlements.error ?? subscriptions.error;
  if (error) return NextResponse.json({ error: "Unable to load billing data" }, { status: 500 });

  return NextResponse.json({
    orders: orders.data ?? [],
    entitlements: entitlements.data ?? [],
    subscriptions: subscriptions.data ?? [],
  });
}
