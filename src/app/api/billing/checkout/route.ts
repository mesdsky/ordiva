import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { appUrl, xenditRequest, type XenditSessionResponse } from "@/lib/xendit";

const PLANS = {
  monthly: { label: "Ordiva Premium Monthly", amount: 29000, kind: "subscription" as const },
  "three-months": { label: "Ordiva Premium 3 Months", amount: 49000, kind: "one-time" as const },
  yearly: { label: "Ordiva Premium Yearly", amount: 108000, kind: "one-time" as const },
  lifetime: { label: "Ordiva Premium Lifetime", amount: 249000, kind: "one-time" as const },
};

type PlanId = keyof typeof PLANS;

function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

function getGivenNames(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const fallbackName = user.email?.split("@")[0] || "Ordiva customer";
  return String(metadataName || fallbackName).trim().slice(0, 100) || "Ordiva customer";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const planId = body?.planId;
    if (!isPlanId(planId)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const plan = PLANS[planId];
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from("billing_orders")
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount: plan.amount,
        currency: "IDR",
        status: "pending",
        metadata: { plan_label: plan.label },
      })
      .select("id")
      .single();

    if (orderError || !order) return NextResponse.json({ error: "Unable to create billing order" }, { status: 500 });

    const basePayload = {
      reference_id: order.id,
      mode: "PAYMENT_LINK",
      currency: "IDR",
      amount: plan.amount,
      country: "ID",
      locale: "id",
      customer: {
        reference_id: user.id,
        type: "INDIVIDUAL",
        email: user.email,
        individual_detail: { given_names: getGivenNames(user) },
      },
    };

    const payload = plan.kind === "subscription"
      ? {
          ...basePayload,
          session_type: "SUBSCRIPTION",
          subscription: {
            schedule: {
              interval: "MONTH",
              interval_count: 1,
              anchor_date: new Date().toISOString(),
              total_recurrence: 0,
              retry_interval: "DAY",
              retry_interval_count: 5,
              total_retry: 7,
              failed_attempt_notifications: [1, 3, 5],
            },
            immediate_payment: true,
            failed_cycle_action: "RESUME",
            notification_channels: ["EMAIL"],
          },
        }
      : {
          ...basePayload,
          session_type: "PAY",
          items: [{
            reference_id: `${order.id}-item`,
            name: plan.label,
            price: plan.amount,
            quantity: 1,
          }],
          success_return_url: `${appUrl()}/billing?checkout=success`,
          failure_return_url: `${appUrl()}/billing?checkout=failed`,
        };

    const session = await xenditRequest<XenditSessionResponse>("/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const sessionId = session.payment_session_id ?? session.id ?? null;
    const checkoutUrl = session.payment_link_url ?? null;

    await admin.from("billing_orders").update({
      provider_session_id: sessionId,
      checkout_url: checkoutUrl,
      metadata: { plan_label: plan.label, xendit_session: session },
    }).eq("id", order.id);

    if (!checkoutUrl) return NextResponse.json({ error: "Xendit did not return a checkout URL" }, { status: 502 });
    return NextResponse.json({ checkoutUrl, orderId: order.id });
  } catch (error) {
    console.error("Billing checkout error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 500 });
  }
}
