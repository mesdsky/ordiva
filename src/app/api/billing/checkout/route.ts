import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { appUrl, xenditRequest, type XenditSessionResponse } from "@/lib/xendit";

const PLANS = {
  monthly: {
    label: "Ordiva Premium Monthly",
    amount: 29000,
    accessMonths: 1,
  },
  "three-months": {
    label: "Ordiva Premium 3 Months",
    amount: 49000,
    accessMonths: 3,
  },
  yearly: {
    label: "Ordiva Premium Yearly",
    amount: 108000,
    accessMonths: 12,
  },
  lifetime: {
    label: "Ordiva Premium Lifetime",
    amount: 249000,
    accessMonths: null,
  },
} as const;

type PlanId = keyof typeof PLANS;

const PREMIUM_BILLING_ENABLED = process.env.PREMIUM_BILLING_ENABLED === "true";

function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

function getGivenNames(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const fallbackName = user.email?.split("@")[0] || "Ordiva customer";
  const safeName = String(metadataName || fallbackName)
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  return safeName || "Ordiva customer";
}

export async function POST(request: Request) {
  if (!PREMIUM_BILLING_ENABLED) {
    return NextResponse.json(
      { error: "Premium checkout is coming soon" },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const planId = body?.planId;

    if (!isPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

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
        metadata: {
          plan_label: plan.label,
          access_months: plan.accessMonths,
        },
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Unable to create billing order" },
        { status: 500 }
      );
    }

    // All Ordiva plans are one-time Payment Sessions.
    // This allows Monthly to use QRIS and other one-time payment methods.
    const payload = {
      session_type: "PAY",
      mode: "PAYMENT_LINK",
      reference_id: order.id,
      currency: "IDR",
      amount: plan.amount,
      country: "ID",
      locale: "id",
      customer: {
        reference_id: `cust-${order.id}`,
        type: "INDIVIDUAL",
        email: user.email,
        individual_detail: {
          given_names: getGivenNames(user),
        },
      },
      items: [
        {
          reference_id: `${order.id}-item`,
          type: "DIGITAL_SERVICE",
          name: plan.label,
          description: "Ordiva Premium digital access",
          net_unit_amount: plan.amount,
          quantity: 1,
          currency: "IDR",
          category: "PREMIUM_ACCESS",
        },
      ],
      success_return_url: `${appUrl()}/billing?checkout=success`,
      cancel_return_url: `${appUrl()}/billing?checkout=cancelled`,
    };

    const session = await xenditRequest<XenditSessionResponse>("/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const sessionId = session.payment_session_id ?? session.id ?? null;
    const checkoutUrl = session.payment_link_url ?? null;

    await admin
      .from("billing_orders")
      .update({
        provider_session_id: sessionId,
        checkout_url: checkoutUrl,
        metadata: {
          plan_label: plan.label,
          access_months: plan.accessMonths,
          xendit_session: session,
        },
      })
      .eq("id", order.id);

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Xendit did not return a checkout URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({ checkoutUrl, orderId: order.id });
  } catch (error) {
    console.error("Billing checkout error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
