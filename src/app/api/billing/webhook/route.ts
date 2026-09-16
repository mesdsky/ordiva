import { NextResponse } from "next/server";
import { assertXenditWebhook } from "@/lib/xendit";
import { createAdminClient } from "@/lib/supabase-admin";

function firstString(...values: unknown[]) {
  return values.find(
    (value): value is string =>
      typeof value === "string" && value.length > 0
  ) ?? null;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString();
}

export async function POST(request: Request) {
  try {
    if (!assertXenditWebhook(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as Record<
      string,
      any
    > | null;

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventName = firstString(
      payload.event,
      payload.type,
      payload.data?.event
    );

    // Payment Session webhooks put the session ID under data.payment_session_id.
    // Keep the event name in the fallback key so completed and expired events
    // for the same session remain distinct.
    const providerEventId =
      firstString(
        request.headers.get("x-event-id"),
        payload.event_id,
        payload.id,
        payload.payment_session_id,
        payload.subscription_id,
        payload.data?.payment_session_id,
        payload.data?.subscription_id,
        payload.data?.recurring_plan_id
      ) ??
      (eventName && payload.data?.reference_id
        ? `${eventName}:${payload.data.reference_id}`
        : null);

    // Xendit's "Test and Save" request can omit business event data.
    // Acknowledge it without changing billing state.
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

    if (
      eventError &&
      !eventError.message.toLowerCase().includes("duplicate")
    ) {
      return NextResponse.json(
        { error: "Unable to record webhook" },
        { status: 500 }
      );
    }

    if (!inserted) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    const referenceId = firstString(
      payload.reference_id,
      payload.external_id,
      payload.metadata?.order_id,
      payload.data?.reference_id,
      payload.data?.external_id
    );

    if (!referenceId) {
      return NextResponse.json({ received: true });
    }

    const status = String(
      payload.status ?? payload.data?.status ?? eventName ?? ""
    ).toUpperCase();
    const paid = [
      "PAID",
      "SUCCEEDED",
      "SUCCESS",
      "COMPLETED",
      "ACTIVE",
    ].some((value) => status.includes(value));
    const failed = [
      "EXPIRED",
      "FAILED",
      "CANCELLED",
      "CANCELED",
    ].some((value) => status.includes(value));

    const { data: order } = await supabase
      .from("billing_orders")
      .select("id, user_id, plan_id, status")
      .eq("id", referenceId)
      .maybeSingle();

    if (!order) return NextResponse.json({ received: true });

    if (failed) {
      await supabase
        .from("billing_orders")
        .update({
          status: status.includes("EXPIRED") ? "expired" : "failed",
        })
        .eq("id", order.id);
    }

    if (paid) {
      const now = new Date();
      const endsAt =
        order.plan_id === "three-months"
          ? addMonths(now, 3)
          : order.plan_id === "yearly"
          ? addMonths(now, 12)
          : null;
      const providerSubscriptionId = firstString(
        payload.subscription_id,
        payload.data?.subscription_id,
        payload.data?.recurring_plan_id,
        payload.id
      );

      await supabase
        .from("billing_orders")
        .update({
          status: "paid",
          paid_at: now.toISOString(),
        })
        .eq("id", order.id);

      await supabase.from("billing_entitlements").upsert(
        {
          user_id: order.user_id,
          order_id: order.id,
          plan_id: order.plan_id,
          status: "active",
          starts_at: now.toISOString(),
          ends_at: endsAt,
          provider_subscription_id: providerSubscriptionId,
        },
        { onConflict: "order_id" }
      );

      if (order.plan_id === "monthly" && providerSubscriptionId) {
        await supabase.from("billing_subscriptions").upsert(
          {
            user_id: order.user_id,
            order_id: order.id,
            provider_subscription_id: providerSubscriptionId,
            plan_id: "monthly",
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: addMonths(now, 1),
            metadata: payload,
          },
          { onConflict: "provider_subscription_id" }
        );
      }

      await supabase
        .from("profiles")
        .update({ plan: "premium" })
        .eq("id", order.user_id);
    }

    await supabase
      .from("billing_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider_event_id", providerEventId);

    return NextResponse.json({ received: true, processed: paid });
  } catch (error) {
    console.error("Billing webhook error", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
