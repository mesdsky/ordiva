"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import PageHero, { heroButton } from "@/components/app/PageHero";
import ConfirmModal from "@/components/ConfirmModal";
import { useCurrency } from "@/hooks/useCurrency";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";

type DebtType = "debt" | "receivable";
type DebtStatus = "active" | "settled";

type Debt = {
  id: string;
  name: string;
  type: DebtType;
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  description: string | null;
  status: DebtStatus;
};

export default function DebtsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settling, setSettling] = useState<string | null>(null);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [plan, setPlan] = useState<"free" | "premium">("free");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("debt");
  const [totalAmount, setTotalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const [paymentAmount, setPaymentAmount] = useState<
    Record<string, string>
  >({});

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

  const {
    currency,
    rate,
    format: formatCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const { setDirty } = useUnsavedChanges();

  const DEBT_LIMIT = 5;

  const activeDebts = debts.filter(
    (item) => item.status === "active"
  );

  const settledDebts = debts.filter(
    (item) => item.status === "settled"
  );

  const activeDebtItems = activeDebts.filter(
    (item) => item.type === "debt"
  );

  const activeReceivables = activeDebts.filter(
    (item) => item.type === "receivable"
  );

  const isFreePlan = plan === "free";

  const hasReachedDebtLimit =
    isFreePlan && activeDebts.length >= DEBT_LIMIT;

  function formatDate(date: string | null) {
    if (!date) return "No due date";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getDaysDifference(dateString: string | null) {
    if (!dateString) return null;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(`${dateString}T00:00:00`);

    targetDate.setHours(0, 0, 0, 0);

    return Math.round(
      (targetDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  function getDueStatus(dateString: string | null) {
    const difference = getDaysDifference(dateString);

    if (difference === null) {
      return {
        label: "No due date",
        overdue: false,
      };
    }

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

  async function loadDebts() {
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
        .from("debts")
        .select(
          "id, name, type, total_amount, remaining_amount, due_date, description, status"
        )
        .eq("user_id", user.id)
        .order("status", {
          ascending: true,
        })
        .order("due_date", {
          ascending: true,
          nullsFirst: false,
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

    setPlan(
      profile?.plan === "premium" ? "premium" : "free"
    );

    const loadedDebts: Debt[] = (data ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.name),
      type:
        item.type === "receivable"
          ? "receivable"
          : "debt",
      total_amount: Number(item.total_amount),
      remaining_amount: Number(item.remaining_amount),
      due_date: item.due_date
        ? String(item.due_date)
        : null,
      description: item.description
        ? String(item.description)
        : null,
      status:
        item.status === "settled"
          ? "settled"
          : "active",
    }));

    setDebts(loadedDebts);
    setLoading(false);
  }

  useEffect(() => {
    // Async data loading intentionally updates UI state after the external request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setName("");
    setType("debt");
    setTotalAmount("");
    setDueDate("");
    setDescription("");
    setShowForm(false);
    setDirty(false);
  }

  function openCreateForm() {
    if (hasReachedDebtLimit) {
      setMessage("");
      setErrorMessage(
        "You&apos;ve reached your Free plan limit. Free users can have up to 5 active debts or receivables."
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

  async function handleCreateDebt(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (hasReachedDebtLimit) {
      setErrorMessage(
        "You&apos;ve reached your Free plan limit. Free users can have up to 5 active debts or receivables."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const trimmedName = name.trim();
    const displayAmount = Number(totalAmount);

    if (!trimmedName) {
      setErrorMessage("Name is required.");
      setSaving(false);
      return;
    }

    if (
      !displayAmount ||
      displayAmount <= 0 ||
      !Number.isFinite(displayAmount)
    ) {
      setErrorMessage(
        "Total amount must be greater than zero."
      );
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
      currency === "IDR"
        ? displayAmount
        : displayAmount / rate;

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

    const { error } = await supabase.from("debts").insert({
      user_id: user.id,
      name: trimmedName,
      type,
      total_amount: numericAmount,
      remaining_amount: numericAmount,
      due_date: dueDate || null,
      description: description.trim() || null,
      status: "active",
    });

    if (error) {
      if (
        error.message.includes(
          "Free plan limit reached"
        )
      ) {
        setErrorMessage(
          "You&apos;ve reached your Free plan limit. Free users can have up to 5 active debts or receivables."
        );
      } else {
        setErrorMessage(error.message);
      }

      setSaving(false);
      return;
    }

    resetForm();

    setMessage(
      type === "debt"
        ? "Debt created successfully."
        : "Receivable created successfully."
    );

    setSaving(false);

    await loadDebts();
  }

  async function handleRecordPayment(debt: Debt) {
    if (debt.status !== "active") {
      return;
    }

    const rawPayment = paymentAmount[debt.id];

    const payment = Number(rawPayment);

    if (
      !payment ||
      payment <= 0 ||
      !Number.isFinite(payment)
    ) {
      setErrorMessage("Enter a valid payment amount.");
      return;
    }

    if (payment > debt.remaining_amount) {
      setErrorMessage(
        "Payment cannot be greater than the remaining amount."
      );
      return;
    }

    setUpdating(debt.id);
    setMessage("");
    setErrorMessage("");

    const newRemaining = Math.max(
      0,
      debt.remaining_amount - payment
    );

    const newStatus =
      newRemaining === 0 ? "settled" : "active";

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setUpdating(null);
      return;
    }

    const { error } = await supabase
      .from("debts")
      .update({
        remaining_amount: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", debt.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setUpdating(null);
      return;
    }

    setPaymentAmount((current) => ({
      ...current,
      [debt.id]: "",
    }));

    setMessage(
      newStatus === "settled"
        ? `${debt.name} has been fully settled.`
        : `Payment recorded for ${debt.name}.`
    );

    setUpdating(null);

    await loadDebts();
  }

  async function handleSettle(debt: Debt) {
    if (debt.status !== "active") {
      return;
    }

    setSettling(debt.id);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setSettling(null);
      return;
    }

    const { error } = await supabase
      .from("debts")
      .update({
        remaining_amount: 0,
        status: "settled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", debt.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setSettling(null);
      return;
    }

    setMessage(`${debt.name} marked as settled.`);

    setSettling(null);

    await loadDebts();
  }

  async function handleReactivate(debt: Debt) {
    if (debt.status !== "settled") {
      return;
    }

    if (
      isFreePlan &&
      activeDebts.length >= DEBT_LIMIT
    ) {
      setMessage("");
      setErrorMessage(
        "You've already reached the 5 active debt limit. Settle another item before reactivating this one."
      );
      return;
    }

    setUpdating(debt.id);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setUpdating(null);
      return;
    }

    const { error } = await supabase
      .from("debts")
      .update({
        status: "active",
        remaining_amount: debt.total_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", debt.id)
      .eq("user_id", user.id);

    if (error) {
      if (
        error.message.includes(
          "Free plan limit reached"
        )
      ) {
        setErrorMessage(
          "You've already reached the 5 active debt limit. Settle another item before reactivating this one."
        );
      } else {
        setErrorMessage(error.message);
      }

      setUpdating(null);
      return;
    }

    setMessage(
      `${debt.name} has been reactivated.`
    );

    setUpdating(null);

    await loadDebts();
  }

  function openDeleteModal(debt: Debt) {
    setDebtToDelete(debt);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setDebtToDelete(null);
  }

  async function confirmDeleteDebt() {
    if (!debtToDelete) {
      return;
    }

    setDeleting(debtToDelete.id);
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
      .from("debts")
      .delete()
      .eq("id", debtToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setDeleting(null);
      return;
    }

    setMessage("Item deleted.");
    setDeleting(null);
    setShowDeleteModal(false);
    setDebtToDelete(null);

    await loadDebts();
  }

  const totalOutstandingDebt =
    activeDebtItems.reduce(
      (total, item) =>
        total + item.remaining_amount,
      0
    );

  const totalOutstandingReceivable =
    activeReceivables.reduce(
      (total, item) =>
        total + item.remaining_amount,
      0
    );

  const netPosition =
    totalOutstandingReceivable -
    totalOutstandingDebt;

  const nearestActiveItem = [...activeDebts]
    .filter((item) => item.due_date)
    .sort((a, b) => {
      return (
        new Date(
          `${a.due_date}T00:00:00`
        ).getTime() -
        new Date(
          `${b.due_date}T00:00:00`
        ).getTime()
      );
    })[0];

  function renderDebtCard(debt: Debt) {
    const dueStatus = getDueStatus(debt.due_date);

    const progress =
      debt.total_amount > 0
        ? Math.min(
            100,
            Math.max(
              0,
              ((debt.total_amount -
                debt.remaining_amount) /
                debt.total_amount) *
                100
            )
          )
        : 0;

    const paymentValue =
      paymentAmount[debt.id] ?? "";

    const isSettled =
      debt.status === "settled";

    return (
      <div
        key={debt.id}
        className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm transition hover:shadow-md"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-[#173C34]">
                {debt.name}
              </h3>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  debt.type === "debt"
                    ? "bg-[#F5F2E8] text-[#7A4D43]"
                    : "bg-[#E8EEDB] text-[#214F43]"
                }`}
              >
                {debt.type === "debt"
                  ? "Debt"
                  : "Receivable"}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isSettled
                    ? "bg-[#F5F2E8] text-[#7B9685]"
                    : "bg-[#E8EEDB] text-[#214F43]"
                }`}
              >
                {isSettled
                  ? "Settled"
                  : "Active"}
              </span>
            </div>

            {debt.description && (
              <p className="mt-2 max-w-xl text-sm text-[#7B9685]">
                {debt.description}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xl font-bold text-[#214F43]">
              {formatCurrency(
                debt.remaining_amount
              )}
            </p>

            <p className="mt-1 text-xs text-[#7B9685]">
              {isSettled
                ? "Fully settled"
                : "Remaining"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#7B9685]">
              Payment progress
            </span>

            <span className="font-semibold text-[#214F43]">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#DDE6D7]">
            <div
              className="h-full rounded-full bg-[#214F43] transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F9F8F2] px-4 py-4">
            <p className="text-xs text-[#7B9685]">
              Original amount
            </p>

            <p className="mt-1 text-sm font-semibold text-[#214F43]">
              {formatCurrency(
                debt.total_amount
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F9F8F2] px-4 py-4">
            <p className="text-xs text-[#7B9685]">
              Due date
            </p>

            <p className="mt-1 text-sm font-semibold text-[#214F43]">
              {formatDate(debt.due_date)}
            </p>
          </div>
        </div>

        {!isSettled && (
          <div
            className={`mt-5 rounded-2xl px-4 py-3 ${
              dueStatus.overdue
                ? "bg-[#FDECEC]"
                : "bg-[#E8EEDB]/60"
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                dueStatus.overdue
                  ? "text-red-700"
                  : "text-[#214F43]"
              }`}
            >
              {dueStatus.label}
            </p>

            {debt.due_date && (
              <p className="mt-1 text-xs text-[#7B9685]">
                Due {formatDate(debt.due_date)}
              </p>
            )}
          </div>
        )}

        {!isSettled && (
          <div className="mt-5 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] p-4">
            <p className="text-sm font-semibold text-[#214F43]">
              Record payment
            </p>

            <p className="mt-1 text-xs text-[#7B9685]">
              Reduce the remaining balance when
              you&apos;ve paid or received money.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="number"
                min="0.01"
                max={debt.remaining_amount}
                step="0.01"
                value={paymentValue}
                onChange={(event) => {
                  setPaymentAmount(
                    (current) => ({
                      ...current,
                      [debt.id]:
                        event.target.value,
                    })
                  );
                }}
                placeholder={
                  currency === "IDR"
                    ? "50000"
                    : "10"
                }
                className="min-w-0 flex-1 rounded-xl border border-[#DDE6D7] bg-white px-4 py-2.5 text-sm outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
              />

              <button
                type="button"
                onClick={() =>
                  handleRecordPayment(debt)
                }
                disabled={
                  updating === debt.id ||
                  !paymentValue
                }
                className="rounded-xl bg-[#214F43] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating === debt.id
                  ? "Updating..."
                  : "Record Payment"}
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSettle(debt)
              }
              disabled={
                settling === debt.id
              }
              className="mt-3 text-xs font-semibold text-[#214F43] transition hover:text-[#173C34] disabled:opacity-50"
            >
              {settling === debt.id
                ? "Settling..."
                : "Mark as fully settled"}
            </button>
          </div>
        )}

        {isSettled && (
          <div className="mt-5 rounded-2xl bg-[#E8EEDB] px-4 py-3">
            <p className="text-xs font-semibold text-[#214F43]">
              ✓ Fully settled
            </p>

            <p className="mt-1 text-xs text-[#7B9685]">
              This item no longer counts toward
              your active Free plan limit.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#DDE6D7] pt-5">
          {isSettled ? (
            <button
              type="button"
              onClick={() =>
                handleReactivate(debt)
              }
              disabled={
                updating === debt.id
              }
              className="text-xs font-semibold text-[#214F43] transition hover:text-[#173C34] disabled:opacity-50"
            >
              {updating === debt.id
                ? "Reactivating..."
                : "Reactivate"}
            </button>
          ) : (
            <span className="text-xs text-[#7B9685]">
              {debt.type === "debt"
                ? "Money you owe"
                : "Money owed to you"}
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              openDeleteModal(debt)
            }
            disabled={
              deleting === debt.id
            }
            className="text-xs font-semibold text-red-600 transition hover:text-red-800 disabled:opacity-50"
          >
            {deleting === debt.id
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>

      <Navigation />

      <main className="relative min-h-screen bg-[#F5F2E8] text-[#173C34]">
        <div className="app-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-12">

          {/* Header */}

          <PageHero
            eyebrow="Debts"
            title="A clearer path"
            accent="forward."
            description="Stay on top of what you owe and what you're still waiting to receive."
            actions={
              <button
                type="button"
                onClick={toggleCreateForm}
                disabled={hasReachedDebtLimit && !showForm}
                className={heroButton}
              >
                {showForm ? "Cancel" : hasReachedDebtLimit ? "Debt Limit Reached" : "+ Add Debt"}
              </button>
            }
          />

          {/* Plan Usage */}

          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-[#DDE6D7] bg-white/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#214F43]">
                {isFreePlan
                  ? `${Math.min(
                      activeDebts.length,
                      DEBT_LIMIT
                    )} / ${DEBT_LIMIT} active debts`
                  : "Unlimited active debts"}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                Settled debts and receivables don&apos;t
                count toward your Free plan limit.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                isFreePlan
                  ? "bg-[#F5F2E8] text-[#5F7168]"
                  : "bg-[#E8EEDB] text-[#214F43]"
              }`}
            >
              {isFreePlan
                ? "Free"
                : "Premium"}
            </span>
          </div>

          {/* Limit notice */}

          {hasReachedDebtLimit && (
            <div className="mt-4 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3">
              <p className="text-sm font-semibold text-[#214F43]">
                You&apos;ve reached your Free plan limit.
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                Free users can have up to 5 active
                debts or receivables. Settle one to
                make room for another.
              </p>
            </div>
          )}

          {/* Nearest Due */}

          {!loading &&
            !currencyLoading &&
            nearestActiveItem && (
              <div
                className={`mt-6 rounded-3xl border p-6 shadow-sm ${
                  getDueStatus(
                    nearestActiveItem.due_date
                  ).overdue
                    ? "border-red-200 bg-[#FDECEC]"
                    : "border-[#DDE6D7] bg-[#E8EEDB]/60"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                      Nearest Due
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-[#214F43]">
                        {nearestActiveItem.name}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          nearestActiveItem.type ===
                          "debt"
                            ? "bg-white text-[#7A4D43]"
                            : "bg-white text-[#214F43]"
                        }`}
                      >
                        {nearestActiveItem.type ===
                        "debt"
                          ? "Debt"
                          : "Receivable"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#5F7168]">
                      {getDueStatus(
                        nearestActiveItem.due_date
                      ).label}{" "}
                      ·{" "}
                      {formatDate(
                        nearestActiveItem.due_date
                      )}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-2xl font-bold text-[#214F43]">
                      {formatCurrency(
                        nearestActiveItem.remaining_amount
                      )}
                    </p>

                    <p className="mt-1 text-xs text-[#7B9685]">
                      Remaining amount
                    </p>
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

          {/* Form */}

          {showForm &&
            !hasReachedDebtLimit && (
              <div className="mt-6 app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm sm:p-7">
                <div className="mb-6">
                  <p className="text-lg font-semibold">
                    Add debt or receivable
                  </p>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Keep your outstanding balances
                    organized in one place.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateDebt}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <div className="md:col-span-2">
                    <label
                      htmlFor="debt-name"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Name
                    </label>

                    <input
                      id="debt-name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setDirty(true);
                      }}
                      placeholder="e.g. Loan to Andi"
                      required
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="debt-type"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Type
                    </label>

                    <select
                      id="debt-type"
                      value={type}
                      onChange={(event) => {
                        setType(
                          event.target.value as DebtType
                        );
                        setDirty(true);
                      }}
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    >
                      <option value="debt">
                        Debt: I owe money
                      </option>

                      <option value="receivable">
                        Receivable: I&apos;m owed money
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="debt-amount"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Total amount ({currency})
                    </label>

                    <input
                      id="debt-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={totalAmount}
                      onChange={(event) => {
                        setTotalAmount(
                          event.target.value
                        );
                        setDirty(true);
                      }}
                      placeholder={
                        currency === "IDR"
                          ? "500000"
                          : "50"
                      }
                      required
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    />

                    <p className="mt-2 text-xs text-[#7B9685]">
                      Stored in IDR and converted for
                      display.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="debt-due-date"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Due date
                      <span className="ml-1 font-normal text-[#7B9685]">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="debt-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(event) => {
                        setDueDate(
                          event.target.value
                        );
                        setDirty(true);
                      }}
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="debt-description"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Description
                      <span className="ml-1 font-normal text-[#7B9685]">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="debt-description"
                      type="text"
                      value={description}
                      onChange={(event) => {
                        setDescription(
                          event.target.value
                        );
                        setDirty(true);
                      }}
                      placeholder="e.g. Laptop installment"
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={
                        saving ||
                        (currency !== "IDR" &&
                          (!Number.isFinite(rate) ||
                            rate <= 0))
                      }
                      className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Adding..."
                        : type === "debt"
                        ? "Add Debt"
                        : "Add Receivable"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          {/* Summary */}

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Total outstanding debt
              </p>

              <p className="mt-3 text-2xl font-bold text-[#7A4D43]">
                {formatCurrency(
                  totalOutstandingDebt
                )}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                {activeDebtItems.length} active
              </p>
            </div>

            <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Total receivable
              </p>

              <p className="mt-3 text-2xl font-bold text-[#214F43]">
                {formatCurrency(
                  totalOutstandingReceivable
                )}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                {activeReceivables.length} active
              </p>
            </div>

            <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Net position
              </p>

              <p className="mt-3 text-2xl font-bold text-[#214F43]">
                {formatCurrency(netPosition)}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                Receivables minus debts
              </p>
            </div>
          </div>

          {/* Active Items */}

          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                  Currently outstanding
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Active debts & receivables
                </h2>
              </div>

              <p className="text-sm text-[#7B9685]">
                {activeDebts.length} active
              </p>
            </div>

            {loading || currencyLoading ? (
              <div role="status" aria-label="Loading your debts" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-4 rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6">
                    <div className="skeleton h-5 w-1/2 rounded-full" />
                    <div className="skeleton h-9 w-2/3 rounded-xl" />
                    <div className="skeleton h-2.5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : activeDebts.length === 0 ? (
              <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-8 shadow-sm md:p-10">
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
                        d="M7 9h10M7 13h5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />

                      <path
                        d="M16 15.5h.01"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-6 text-2xl font-bold tracking-tight text-[#173C34]">
                    Know what you owe and what you&apos;re owed.
                  </p>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#7B9685] md:text-base">
                    Keep loans, installments, and money
                    you&apos;re waiting to receive in one place.
                    Ordiva helps you see outstanding balances,
                    due dates, and payment progress at a glance.
                  </p>

                  <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        01 · Add what matters
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Record money you owe or money that
                        someone still owes you.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        02 · Set the details
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Add the total amount and due date so
                        important obligations stay visible.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        03 · Track the balance
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Record payments as they happen and
                        watch the remaining balance move down.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateForm}
                    disabled={hasReachedDebtLimit}
                    className={`mt-8 rounded-2xl px-6 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(33,79,67,0.10)] transition ${
                      hasReachedDebtLimit
                        ? "cursor-not-allowed bg-[#DDE6D7] text-[#7B9685]"
                        : "bg-[#214F43] text-white hover:-translate-y-0.5 hover:bg-[#173C34]"
                    }`}
                  >
                    + Add Your First Debt
                  </button>

                  <p className="mt-4 text-xs text-[#7B9685]">
                    You can also add a receivable if someone owes
                    money to you.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {activeDebts.map(renderDebtCard)}
              </div>
            )}
          </section>

          {/* Settled */}

          {!loading && settledDebts.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                    Completed
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Settled
                  </h2>
                </div>

                <p className="text-sm text-[#7B9685]">
                  {settledDebts.length} settled
                </p>
              </div>

              <div className="space-y-5">
                {settledDebts.map(renderDebtCard)}
              </div>
            </section>
          )}
        </div>
      </main>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete this item?"
        description={
          debtToDelete
            ? `You are about to delete "${debtToDelete.name}". This action cannot be undone.`
            : "This item will be permanently deleted."
        }
        confirmLabel="Delete"
        cancelLabel="Keep item"
        danger
        loading={Boolean(deleting)}
        onConfirm={confirmDeleteDebt}
        onCancel={closeDeleteModal}
      />
    </>
  );
}