"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useCurrency } from "@/hooks/useCurrency";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";

type Subscription = {
  id: string;
  name: string;
  amount: number;
  billing_cycle: "weekly" | "monthly" | "yearly";
  next_payment_date: string;
  last_paid_date: string | null;
  category: string | null;
  active: boolean;
};

export default function SubscriptionsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plan, setPlan] = useState<"free" | "premium">("free");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] =
    useState<"weekly" | "monthly" | "yearly">("monthly");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [category, setCategory] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] =
    useState<Subscription | null>(null);

  const {
    currency,
    rate,
    format: formatCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const { setDirty } = useUnsavedChanges();

  const SUBSCRIPTION_LIMIT = 5;

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.active
  );

  const pausedSubscriptions = subscriptions.filter(
    (subscription) => !subscription.active
  );

  const isFreePlan = plan === "free";

  const hasReachedSubscriptionLimit =
    isFreePlan &&
    activeSubscriptions.length >= SUBSCRIPTION_LIMIT;

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getCycleLabel(cycle: Subscription["billing_cycle"]) {
    if (cycle === "weekly") return "Weekly";
    if (cycle === "yearly") return "Yearly";
    return "Monthly";
  }

  function getMonthlyEquivalent(subscription: Subscription) {
    if (subscription.billing_cycle === "weekly") {
      return (subscription.amount * 52) / 12;
    }

    if (subscription.billing_cycle === "yearly") {
      return subscription.amount / 12;
    }

    return subscription.amount;
  }

  function getDaysDifference(dateString: string) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(`${dateString}T00:00:00`);

    targetDate.setHours(0, 0, 0, 0);

    return Math.round(
      (targetDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  function getPaymentStatus(dateString: string) {
    const difference = getDaysDifference(dateString);

    if (difference < 0) {
      return {
        label: `${Math.abs(difference)} ${
          Math.abs(difference) === 1 ? "day" : "days"
        } overdue`,
        overdue: true,
      };
    }

    if (difference === 0) {
      return {
        label: "Due today",
        overdue: false,
      };
    }

    if (difference === 1) {
      return {
        label: "Due tomorrow",
        overdue: false,
      };
    }

    return {
      label: `Due in ${difference} days`,
      overdue: false,
    };
  }

  function getPreviousCycleDate(
    dateString: string,
    cycle: Subscription["billing_cycle"]
  ) {
    const date = new Date(`${dateString}T00:00:00`);

    if (cycle === "weekly") {
      date.setDate(date.getDate() - 7);
    } else if (cycle === "monthly") {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setFullYear(date.getFullYear() - 1);
    }

    return date;
  }

  function isPaidForCurrentCycle(subscription: Subscription) {
    if (!subscription.last_paid_date) {
      return false;
    }

    const cycleStart = getPreviousCycleDate(
      subscription.next_payment_date,
      subscription.billing_cycle
    );

    const lastPaid = new Date(
      `${subscription.last_paid_date}T00:00:00`
    );

    const nextPayment = new Date(
      `${subscription.next_payment_date}T00:00:00`
    );

    return lastPaid >= cycleStart && lastPaid < nextPayment;
  }

  const nextPayment = [...activeSubscriptions].sort((a, b) => {
    return (
      new Date(`${a.next_payment_date}T00:00:00`).getTime() -
      new Date(`${b.next_payment_date}T00:00:00`).getTime()
    );
  })[0];

  async function loadSubscriptions() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [
      { data: profile, error: profileError },
      { data, error },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single(),

      supabase
        .from("subscriptions")
        .select(
          "id, name, amount, billing_cycle, next_payment_date, last_paid_date, category, active"
        )
        .eq("user_id", user.id)
        .order("next_payment_date", {
          ascending: true,
        }),
    ]);

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setPlan(profile?.plan === "premium" ? "premium" : "free");

    const loadedSubscriptions: Subscription[] = (data ?? []).map(
      (subscription) => ({
        id: String(subscription.id),
        name: String(subscription.name),
        amount: Number(subscription.amount),
        billing_cycle:
          subscription.billing_cycle as Subscription["billing_cycle"],
        next_payment_date: String(subscription.next_payment_date),
        last_paid_date: subscription.last_paid_date
          ? String(subscription.last_paid_date)
          : null,
        category: subscription.category
          ? String(subscription.category)
          : null,
        active: Boolean(subscription.active),
      })
    );

    setSubscriptions(loadedSubscriptions);
    setLoading(false);
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  function resetForm() {
    setName("");
    setAmount("");
    setBillingCycle("monthly");
    setNextPaymentDate("");
    setCategory("");
    setShowForm(false);
    setDirty(false);
  }

  function openCreateForm() {
    if (hasReachedSubscriptionLimit) {
      setMessage("");
      setErrorMessage(
        "You've reached your Free plan limit. Free users can have up to 5 active subscriptions."
      );
      return;
    }

    setShowForm(true);
    setMessage("");
    setErrorMessage("");
  }

  function toggleCreateForm() {
    if (showForm) {
      resetForm();
      return;
    }

    openCreateForm();
  }

  async function handleCreateSubscription(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (hasReachedSubscriptionLimit) {
      setErrorMessage(
        "You've reached your Free plan limit. Free users can have up to 5 active subscriptions."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const trimmedName = name.trim();
    const displayAmount = Number(amount);

    if (!trimmedName) {
      setErrorMessage("Subscription name is required.");
      setSaving(false);
      return;
    }

    if (
      !displayAmount ||
      displayAmount <= 0 ||
      !Number.isFinite(displayAmount)
    ) {
      setErrorMessage("Amount must be greater than zero.");
      setSaving(false);
      return;
    }

    if (!nextPaymentDate) {
      setErrorMessage("Next payment date is required.");
      setSaving(false);
      return;
    }

    if (
      currency !== "IDR" &&
      (!Number.isFinite(rate) || rate <= 0)
    ) {
      setErrorMessage(
        "Exchange rate is unavailable. Please try again."
      );
      setSaving(false);
      return;
    }

    const numericAmount =
      currency === "IDR" ? displayAmount : displayAmount / rate;

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setErrorMessage("Please enter a valid amount.");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        name: trimmedName,
        amount: numericAmount,
        billing_cycle: billingCycle,
        next_payment_date: nextPaymentDate,
        category: category.trim() || null,
        active: true,
      });

    if (error) {
      if (error.message.includes("Free plan limit reached")) {
        setErrorMessage(
          "You've reached your Free plan limit. Free users can have up to 5 active subscriptions."
        );
      } else {
        setErrorMessage(error.message);
      }

      setSaving(false);
      return;
    }

    resetForm();

    setMessage("Subscription created successfully.");

    setSaving(false);

    await loadSubscriptions();
  }

  async function handleMarkAsPaid(subscription: Subscription) {
    if (!subscription.active) {
      return;
    }

    setPaying(subscription.id);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setPaying(null);
      return;
    }

    const { error } = await supabase.rpc(
      "mark_subscription_paid",
      {
        p_subscription_id: subscription.id,
      }
    );

    if (error) {
      if (error.message.includes("already been paid")) {
        setErrorMessage(
          "This billing cycle has already been marked as paid."
        );
      } else if (error.message.includes("inactive subscription")) {
        setErrorMessage(
          "Inactive subscriptions cannot be marked as paid."
        );
      } else {
        setErrorMessage(error.message);
      }

      setPaying(null);
      return;
    }

    setMessage(
      `${subscription.name} marked as paid. Next payment has been scheduled automatically.`
    );

    setPaying(null);

    await loadSubscriptions();
  }

  async function handleToggleSubscription(
    subscription: Subscription
  ) {
    if (
      !subscription.active &&
      hasReachedSubscriptionLimit
    ) {
      setMessage("");
      setErrorMessage(
        "You've already reached the 5 active subscription limit. Pause another subscription before activating this one."
      );
      return;
    }

    setToggling(subscription.id);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setToggling(null);
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        active: !subscription.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .eq("user_id", user.id);

    if (error) {
      if (error.message.includes("Free plan limit reached")) {
        setErrorMessage(
          "You've already reached the 5 active subscription limit. Pause another subscription before activating this one."
        );
      } else {
        setErrorMessage(error.message);
      }

      setToggling(null);
      return;
    }

    setMessage(
      subscription.active
        ? "Subscription paused."
        : "Subscription activated."
    );

    setToggling(null);

    await loadSubscriptions();
  }

  function openDeleteModal(subscription: Subscription) {
    setSubscriptionToDelete(subscription);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setSubscriptionToDelete(null);
  }

  async function confirmDeleteSubscription() {
    if (!subscriptionToDelete) {
      return;
    }

    setDeleting(subscriptionToDelete.id);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setDeleting(null);
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", subscriptionToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setDeleting(null);
      return;
    }

    setMessage("Subscription deleted.");
    setDeleting(null);
    setShowDeleteModal(false);
    setSubscriptionToDelete(null);

    await loadSubscriptions();
  }

  const totalMonthlyCost = activeSubscriptions.reduce(
    (total, subscription) =>
      total + getMonthlyEquivalent(subscription),
    0
  );

  const totalAnnualCost = activeSubscriptions.reduce(
    (total, subscription) => {
      if (subscription.billing_cycle === "yearly") {
        return total + subscription.amount;
      }

      if (subscription.billing_cycle === "monthly") {
        return total + subscription.amount * 12;
      }

      return total + subscription.amount * 52;
    },
    0
  );

  function renderSubscriptionCard(subscription: Subscription) {
    const monthlyEquivalent =
      getMonthlyEquivalent(subscription);

    const paymentStatus = getPaymentStatus(
      subscription.next_payment_date
    );

    const paidForCurrentCycle =
      isPaidForCurrentCycle(subscription);

    return (
      <div
        key={subscription.id}
        className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm transition hover:shadow-md"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-[#173C34]">
                {subscription.name}
              </h3>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  subscription.active
                    ? "bg-[#E8EEDB] text-[#214F43]"
                    : "bg-[#F5F2E8] text-[#7B9685]"
                }`}
              >
                {subscription.active ? "Active" : "Paused"}
              </span>

              {paidForCurrentCycle &&
                subscription.active && (
                  <span className="rounded-full bg-[#214F43] px-2.5 py-1 text-[11px] font-semibold text-white">
                    ✓ Paid
                  </span>
                )}

              {subscription.category && (
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#7B9685]">
                  {subscription.category}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-[#7B9685]">
              {getCycleLabel(subscription.billing_cycle)} · Next payment{" "}
              {formatDate(subscription.next_payment_date)}
            </p>

            {subscription.last_paid_date && (
              <p className="mt-1 text-xs text-[#7B9685]">
                Last paid {formatDate(subscription.last_paid_date)}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xl font-bold text-[#214F43]">
              {formatCurrency(subscription.amount)}
            </p>

            <p className="mt-1 text-xs text-[#7B9685]">
              {getCycleLabel(subscription.billing_cycle).toLowerCase()}
            </p>
          </div>
        </div>

        {subscription.active && (
          <div
            className={`mt-5 rounded-2xl px-4 py-3 ${
              paymentStatus.overdue && !paidForCurrentCycle
                ? "bg-[#FDECEC]"
                : paidForCurrentCycle
                ? "bg-[#E8EEDB]"
                : "bg-[#E8EEDB]/60"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className={`text-xs font-semibold ${
                    paymentStatus.overdue && !paidForCurrentCycle
                      ? "text-red-700"
                      : "text-[#214F43]"
                  }`}
                >
                  {paidForCurrentCycle
                    ? "Paid for this cycle"
                    : paymentStatus.label}
                </p>

                <p className="mt-1 text-xs text-[#7B9685]">
                  Next payment{" "}
                  {formatDate(subscription.next_payment_date)}
                </p>
              </div>

              <p
                className={`text-sm font-bold ${
                  paymentStatus.overdue && !paidForCurrentCycle
                    ? "text-red-700"
                    : "text-[#214F43]"
                }`}
              >
                {formatCurrency(subscription.amount)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F9F8F2] px-4 py-4">
            <p className="text-xs text-[#7B9685]">
              Monthly equivalent
            </p>

            <p className="mt-1 text-sm font-semibold text-[#214F43]">
              {formatCurrency(monthlyEquivalent)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F9F8F2] px-4 py-4">
            <p className="text-xs text-[#7B9685]">
              Billing cycle
            </p>

            <p className="mt-1 text-sm font-semibold text-[#214F43]">
              {getCycleLabel(subscription.billing_cycle)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDE6D7] pt-5">
          <div className="flex flex-wrap items-center gap-4">
            {subscription.active &&
              !paidForCurrentCycle && (
                <button
                  type="button"
                  onClick={() => handleMarkAsPaid(subscription)}
                  disabled={paying === subscription.id}
                  className="rounded-xl bg-[#214F43] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paying === subscription.id
                    ? "Updating..."
                    : "✓ Mark as Paid"}
                </button>
              )}

            <button
              type="button"
              onClick={() => handleToggleSubscription(subscription)}
              disabled={toggling === subscription.id}
              className="text-xs font-semibold text-[#214F43] transition hover:text-[#173C34] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {toggling === subscription.id
                ? "Updating..."
                : subscription.active
                ? "Pause subscription"
                : "Activate subscription"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => openDeleteModal(subscription)}
            disabled={deleting === subscription.id}
            className="text-xs font-semibold text-red-600 transition hover:text-red-800 disabled:opacity-50"
          >
            {deleting === subscription.id
              ? "Deleting..."
              : "Delete subscription"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[170px] bg-[linear-gradient(180deg,#DDE8D8_0%,#F0F1E8_42%,#F5F2E8_100%)]"
      />

      <Navigation />

      <main className="relative z-10 min-h-screen bg-[#F5F2E8] text-[#173C34]">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
          {/* Header */}

          <div className="flex flex-col gap-4 border-b border-[#DDE6D7] pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7B9685]">
                Ordiva Subscriptions
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Subscriptions
              </h1>

              <p className="mt-3 max-w-2xl text-lg text-[#5F7168]">
                Keep track of recurring expenses and never lose sight of what
                you pay for.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleCreateForm}
              disabled={hasReachedSubscriptionLimit && !showForm}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(33,79,67,0.10)] transition ${
                hasReachedSubscriptionLimit && !showForm
                  ? "cursor-not-allowed bg-[#DDE6D7] text-[#7B9685]"
                  : "bg-[#214F43] text-white hover:-translate-y-0.5 hover:bg-[#173C34]"
              }`}
            >
              {showForm
                ? "Cancel"
                : hasReachedSubscriptionLimit
                ? "Subscription Limit Reached"
                : "+ Add Subscription"}
            </button>
          </div>

          {/* Plan Usage */}

          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-[#DDE6D7] bg-white/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#214F43]">
                {isFreePlan
                  ? `${Math.min(
                      activeSubscriptions.length,
                      SUBSCRIPTION_LIMIT
                    )} / ${SUBSCRIPTION_LIMIT} active subscriptions`
                  : "Unlimited active subscriptions"}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                {isFreePlan
                  ? "Paused subscriptions don't count toward your Free plan limit."
                  : "Premium plan includes unlimited active subscriptions."}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                isFreePlan
                  ? "bg-[#F5F2E8] text-[#5F7168]"
                  : "bg-[#E8EEDB] text-[#214F43]"
              }`}
            >
              {isFreePlan ? "Free" : "Premium"}
            </span>
          </div>

          {/* Limit Notice */}

          {hasReachedSubscriptionLimit && (
            <div className="mt-4 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3">
              <p className="text-sm font-semibold text-[#214F43]">
                You've reached your Free plan limit.
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                Free users can have up to 5 active subscriptions. Pause one to
                activate another, or upgrade to Premium later for unlimited
                subscriptions.
              </p>
            </div>
          )}

          {/* Next Payment */}

          {!loading && !currencyLoading && nextPayment && (
            <div
              className={`mt-6 rounded-3xl border p-6 shadow-sm ${
                getPaymentStatus(nextPayment.next_payment_date).overdue &&
                !isPaidForCurrentCycle(nextPayment)
                  ? "border-red-200 bg-[#FDECEC]"
                  : isPaidForCurrentCycle(nextPayment)
                  ? "border-[#BFD0B8] bg-[#E8EEDB]"
                  : "border-[#DDE6D7] bg-[#E8EEDB]/60"
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                    Next Payment
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#214F43]">
                      {nextPayment.name}
                    </h2>

                    {isPaidForCurrentCycle(nextPayment) ? (
                      <span className="rounded-full bg-[#214F43] px-2.5 py-1 text-[11px] font-semibold text-white">
                        ✓ Paid
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          getPaymentStatus(
                            nextPayment.next_payment_date
                          ).overdue
                            ? "bg-[#FDECEC] text-red-700"
                            : "bg-white/80 text-[#214F43]"
                        }`}
                      >
                        {
                          getPaymentStatus(
                            nextPayment.next_payment_date
                          ).label
                        }
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-[#5F7168]">
                    {formatDate(nextPayment.next_payment_date)} ·{" "}
                    {getCycleLabel(nextPayment.billing_cycle)}
                  </p>

                  {isPaidForCurrentCycle(nextPayment) &&
                    nextPayment.last_paid_date && (
                      <p className="mt-1 text-xs text-[#7B9685]">
                        Paid on {formatDate(nextPayment.last_paid_date)}
                      </p>
                    )}
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-[#214F43]">
                      {formatCurrency(nextPayment.amount)}
                    </p>

                    <p className="mt-1 text-xs text-[#7B9685]">
                      Upcoming payment
                    </p>
                  </div>

                  {nextPayment.active &&
                    !isPaidForCurrentCycle(nextPayment) && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsPaid(nextPayment)}
                        disabled={paying === nextPayment.id}
                        className="rounded-xl bg-[#214F43] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {paying === nextPayment.id
                          ? "Updating..."
                          : "✓ Mark as Paid"}
                      </button>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}

          {(message || errorMessage) && (
            <div
              className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                errorMessage
                  ? "bg-[#FDECEC] text-red-700"
                  : "bg-[#E8EEDB] text-[#214F43]"
              }`}
            >
              {errorMessage || message}
            </div>
          )}

          {/* Create Form */}

          {showForm && !hasReachedSubscriptionLimit && (
            <div className="mt-6 rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-lg font-semibold">Add a subscription</p>

                <p className="mt-1 text-sm text-[#7B9685]">
                  Track a recurring expense so you always know what's coming
                  next.
                </p>
              </div>

              <form
                onSubmit={handleCreateSubscription}
                className="grid gap-5 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label
                    htmlFor="subscription-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Subscription name
                  </label>

                  <input
                    id="subscription-name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setDirty(true);
                    }}
                    placeholder="e.g. Netflix"
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subscription-amount"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Amount ({currency})
                  </label>

                  <input
                    id="subscription-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setDirty(true);
                    }}
                    placeholder={currency === "IDR" ? "150000" : "10"}
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />

                  <p className="mt-2 text-xs text-[#7B9685]">
                    Stored in IDR and converted for display.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="subscription-cycle"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Billing cycle
                  </label>

                  <select
                    id="subscription-cycle"
                    value={billingCycle}
                    onChange={(event) => {
                      setBillingCycle(
                        event.target.value as Subscription["billing_cycle"]
                      );
                      setDirty(true);
                    }}
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="subscription-date"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Next payment date
                  </label>

                  <input
                    id="subscription-date"
                    type="date"
                    value={nextPaymentDate}
                    onChange={(event) => {
                      setNextPaymentDate(event.target.value);
                      setDirty(true);
                    }}
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />

                  <p className="mt-2 text-xs text-[#7B9685]">
                    We'll highlight the closest payment for you.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="subscription-category"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Category
                    <span className="ml-1 font-normal text-[#7B9685]">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="subscription-category"
                    type="text"
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value);
                      setDirty(true);
                    }}
                    placeholder="e.g. Entertainment"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (currency !== "IDR" &&
                        (!Number.isFinite(rate) || rate <= 0))
                    }
                    className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Adding subscription..." : "Add subscription"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Summary */}

          <div className="mt-8 grid gap-x-8 gap-y-5 md:grid-cols-3">
            <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Active subscriptions
              </p>

              <p className="mt-3 text-2xl font-bold">
                {activeSubscriptions.length}
              </p>
            </div>

            <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Monthly equivalent
              </p>

              <p className="mt-3 text-2xl font-bold text-[#214F43]">
                {formatCurrency(totalMonthlyCost)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Estimated yearly cost
              </p>

              <p className="mt-3 text-2xl font-bold">
                {formatCurrency(totalAnnualCost)}
              </p>
            </div>
          </div>

          {/* Active */}

          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                  Currently running
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Active subscriptions
                </h2>
              </div>

              <p className="text-sm text-[#7B9685]">
                {activeSubscriptions.length} active
              </p>
            </div>

            {loading || currencyLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-3xl border border-[#DDE6D7] bg-white/70 shadow-sm">
                <p className="text-sm text-[#7B9685]">
                  Loading your subscriptions...
                </p>
              </div>
            ) : activeSubscriptions.length === 0 ? (
              <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-8 shadow-sm md:p-10">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EEDB] text-[#214F43]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-7 w-7"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />

                      <path
                        d="M7 9h10M7 13h4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />

                      <circle
                        cx="17"
                        cy="14"
                        r="1.2"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <p className="mt-6 text-2xl font-bold tracking-tight text-[#173C34]">
                    Keep recurring expenses under control.
                  </p>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#7B9685] md:text-base">
                    Add subscriptions and recurring payments to see what&apos;s
                    coming up, understand your monthly commitment, and avoid
                    unexpected charges.
                  </p>

                  <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        01 · Add recurring costs
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Record subscriptions like streaming, software, or
                        memberships.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        02 · Set the next payment
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Add the next payment date so Ordiva can highlight what
                        is due next.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        03 · Track the commitment
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        See your monthly equivalent and estimated yearly cost
                        at a glance.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateForm}
                    disabled={hasReachedSubscriptionLimit}
                    className={`mt-8 rounded-2xl px-6 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(33,79,67,0.10)] transition ${
                      hasReachedSubscriptionLimit
                        ? "cursor-not-allowed bg-[#DDE6D7] text-[#7B9685]"
                        : "bg-[#214F43] text-white hover:-translate-y-0.5 hover:bg-[#173C34]"
                    }`}
                  >
                    + Add Your First Subscription
                  </button>

                  <p className="mt-4 text-xs text-[#7B9685]">
                    Start with the recurring payments you use most often.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {activeSubscriptions.map(renderSubscriptionCard)}
              </div>
            )}
          </section>

          {/* Paused */}

          {!loading && pausedSubscriptions.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                    Not currently active
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Paused subscriptions
                  </h2>
                </div>

                <p className="text-sm text-[#7B9685]">
                  {pausedSubscriptions.length} paused
                </p>
              </div>

              <div className="space-y-5">
                {pausedSubscriptions.map(renderSubscriptionCard)}
              </div>
            </section>
          )}
        </div>
      </main>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete this subscription?"
        description={
          subscriptionToDelete
            ? `You are about to delete "${subscriptionToDelete.name}". This action cannot be undone.`
            : "This subscription will be permanently deleted."
        }
        confirmLabel="Delete subscription"
        cancelLabel="Keep subscription"
        danger
        loading={Boolean(deleting)}
        onConfirm={confirmDeleteSubscription}
        onCancel={closeDeleteModal}
      />
    </>
  );
}