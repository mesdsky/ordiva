import { NextResponse } from "next/server";
import { assertXenditWebhook, classifyStatus } from "@/lib/xendit";
import { createAdminClient } from "@/lib/supabase-admin";

function firstString(...values: unknown[]) {
  return (
    values.find(
      (value): value is string =>
        typeof value === "string" && value.length > 0
    ) ?? null
  );
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString();
}

async function markProcessed(providerEventId: string) {
  await createAdminClient()
    .from("billing_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider_event_id", providerEventId);
}

export async function POST(request: Request) {
  try {
    if (!assertXenditWebhook(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped provider payload
    const payload = (await request.json().catch(() => null)) as Record<string, any> | null;

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventName = firstString(
      payload.event,
      payload.type,
      payload.data?.event
    );

    // Payment Session webhooks put the important fields under data.
    const data = payload.data ?? {};
    const providerEventId =
      firstString(
        request.headers.get("x-event-id"),
        payload.event_id,
        payload.id,
        data.event_id,
        data.id
      ) ??
      (eventName && data.reference_id
        ? `${eventName}:${data.reference_id}`
        : firstString(data.payment_session_id, data.recurring_plan_id));

    // Xendit's "Test and Save" request can omit business event data.
    if (!providerEventId) {
      return NextResponse.json({
        received: true,
        test: true,
        processed: false,
      });
    }

    const supabase = createAdminClient();

    const { data: inserted, error: eventError } = await supabase
      .from("billing_webhook_events")
      .insert({
        provider_event_id: providerEventId,
        event_type: eventName,
        payload,
      })
      .select("id")
      .maybeSingle();

    // 23505 = unique violation, i.e. a retry of an event we already saw.
    if (eventError && eventError.code !== "23505") {
      return NextResponse.json(
        { error: "Unable to record webhook" },
        { status: 500 }
      );
    }

    if (!inserted) {
      // Only skip retries that were fully processed. A retry after a
      // crash mid-processing must go through, or the payment is lost.
      const { data: existing } = await supabase
        .from("billing_webhook_events")
        .select("processed_at")
        .eq("provider_event_id", providerEventId)
        .maybeSingle();

      if (existing?.processed_at) {
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    const referenceId = firstString(
      payload.reference_id,
      payload.external_id,
      payload.metadata?.order_id,
      data.reference_id,
      data.external_id
    );

    if (!referenceId) {
      return NextResponse.json({ received: true });
    }

    const status = String(
      payload.status ?? data.status ?? eventName ?? ""
    ).toUpperCase();
    const { paid, failed, expired } = classifyStatus(status);

    const { data: order } = await supabase
      .from("billing_orders")
      .select("id, user_id, plan_id, status, amount")
      .eq("id", referenceId)
      .maybeSingle();

    // Only pending orders can change state. Stops a late "expired"
    // event from downgrading a paid order, and replays from re-granting.
    if (!order || order.status !== "pending") {
      await markProcessed(providerEventId);
      return NextResponse.json({ received: true });
    }

    const paidAmount = Number(data.amount ?? payload.amount);
    if (paid && Number.isFinite(paidAmount) && paidAmount !== order.amount) {
      console.error("Billing webhook amount mismatch", {
        orderId: order.id,
        expected: order.amount,
        received: paidAmount,
      });
      // Never grant access; acknowledge so Xendit stops retrying and
      // leave the order pending for manual review.
      await markProcessed(providerEventId);
      return NextResponse.json({ received: true, processed: false });
    }

    if (failed) {
      await supabase
        .from("billing_orders")
        .update({ status: expired ? "expired" : "failed" })
        .eq("id", order.id)
        .eq("status", "pending");
    }

    if (paid) {
      const now = new Date();
      const endsAt =
        order.plan_id === "monthly"
          ? addMonths(now, 1)
          : order.plan_id === "three-months"
          ? addMonths(now, 3)
          : order.plan_id === "yearly"
          ? addMonths(now, 12)
          : null;

      const { error: entitlementError } = await supabase.from("billing_entitlements").upsert(
        {
          user_id: order.user_id,
          order_id: order.id,
          plan_id: order.plan_id,
          status: "active",
          starts_at: now.toISOString(),
          ends_at: endsAt,
          // One-time plans must not create a recurring subscription record.
          provider_subscription_id: null,
        },
        { onConflict: "order_id" }
      );
      if (entitlementError) throw entitlementError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan: "premium" })
        .eq("id", order.user_id);
      if (profileError) throw profileError;

      // Flip the order last: if anything above fails, the retry still
      // sees a pending order and redoes the (idempotent) grant.
      await supabase
        .from("billing_orders")
        .update({
          status: "paid",
          paid_at: now.toISOString(),
        })
        .eq("id", order.id)
        .eq("status", "pending");
    }

    await markProcessed(providerEventId);

    return NextResponse.json({ received: true, processed: paid });
  } catch (error) {
    console.error("Billing webhook error", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
