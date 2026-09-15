"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useCurrency } from "@/hooks/useCurrency";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  description: string | null;
};

export default function GoalsPage() {
  const router = useRouter();

  const {
    currency,
    rate,
    format: formatCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const { setDirty } = useUnsavedChanges();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSavings, setAddingSavings] = useState<string | null>(null);
  const [removingSavings, setRemovingSavings] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [plan, setPlan] = useState<"free" | "premium">("free");

  const [showForm, setShowForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState<string | null>(null);
  const [savingsMode, setSavingsMode] = useState<"add" | "remove">("add");

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");

  const [savingsAmount, setSavingsAmount] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const GOAL_LIMIT = 3;
  const isFreePlan = plan === "free";
  const hasReachedGoalLimit = isFreePlan && goals.length >= GOAL_LIMIT;

  function formatDate(date: string | null) {
    if (!date) {
      return "No target date";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function loadGoals() {
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

    const [{ data: profile, error: profileError }, { data, error }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single(),

        supabase
          .from("goals")
          .select(
            "id, name, target_amount, current_amount, target_date, description"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
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

    const loadedGoals: Goal[] = (data ?? []).map((goal) => ({
      id: String(goal.id),
      name: String(goal.name),
      target_amount: Number(goal.target_amount),
      current_amount: Number(goal.current_amount),
      target_date: goal.target_date ? String(goal.target_date) : null,
      description: goal.description ? String(goal.description) : null,
    }));

    setGoals(loadedGoals);
    setLoading(false);
  }

  useEffect(() => {
    // Async data loading intentionally updates UI state after the external request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markFormDirty() {
    setDirty(true);
  }

  function resetCreateForm() {
    setGoalName("");
    setTargetAmount("");
    setCurrentAmount("");
    setTargetDate("");
    setDescription("");
    setShowForm(false);
    setDirty(false);
  }

  function closeSavingsForm() {
    setShowSavingsForm(null);
    setSavingsAmount("");
    setErrorMessage("");
    setDirty(false);
  }

  function openCreateForm() {
    if (hasReachedGoalLimit) {
      setMessage("");
      setErrorMessage(
        "You&apos;ve reached your Free plan limit. Free users can create up to 3 goals."
      );
      return;
    }

    setShowForm(true);
    setMessage("");
    setErrorMessage("");
  }

  function toggleCreateForm() {
    if (showForm) {
      resetCreateForm();
      return;
    }

    openCreateForm();
  }

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasReachedGoalLimit) {
      setErrorMessage(
        "You&apos;ve reached your Free plan limit. Free users can create up to 3 goals."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const trimmedName = goalName.trim();
    const displayTarget = Number(targetAmount);
    const displayCurrent = currentAmount ? Number(currentAmount) : 0;

    if (
      currency !== "IDR" &&
      (!Number.isFinite(rate) || rate <= 0)
    ) {
      setErrorMessage("Exchange rate is unavailable. Please try again.");
      setSaving(false);
      return;
    }

    const numericTarget =
      currency === "IDR" ? displayTarget : displayTarget / rate;

    const numericCurrent =
      currency === "IDR" ? displayCurrent : displayCurrent / rate;

    if (!trimmedName) {
      setErrorMessage("Goal name is required.");
      setSaving(false);
      return;
    }

    if (!numericTarget || numericTarget <= 0) {
      setErrorMessage("Target amount must be greater than zero.");
      setSaving(false);
      return;
    }

    if (numericCurrent < 0) {
      setErrorMessage("Current amount cannot be negative.");
      setSaving(false);
      return;
    }

    if (numericCurrent > numericTarget) {
      setErrorMessage(
        "Current amount cannot be greater than the target amount."
      );
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

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      name: trimmedName,
      target_amount: numericTarget,
      current_amount: numericCurrent,
      target_date: targetDate || null,
      description: description.trim() || null,
    });

    if (error) {
      if (error.message.includes("Free plan limit reached")) {
        setErrorMessage(
          "You&apos;ve reached your Free plan limit. Free users can create up to 3 goals."
        );
      } else {
        setErrorMessage(error.message);
      }

      setSaving(false);
      return;
    }

    resetCreateForm();

    setMessage("Goal created successfully.");
    setSaving(false);

    await loadGoals();
  }

  async function handleUpdateSavings(
    event: FormEvent<HTMLFormElement>,
    goal: Goal
  ) {
    event.preventDefault();

    const isAdding = savingsMode === "add";

    if (isAdding) {
      setAddingSavings(goal.id);
    } else {
      setRemovingSavings(goal.id);
    }

    setMessage("");
    setErrorMessage("");

    const displaySavings = Number(savingsAmount);

    if (!displaySavings || displaySavings <= 0) {
      setErrorMessage("Savings amount must be greater than zero.");
      setAddingSavings(null);
      setRemovingSavings(null);
      return;
    }

    if (
      currency !== "IDR" &&
      (!Number.isFinite(rate) || rate <= 0)
    ) {
      setErrorMessage("Exchange rate is unavailable. Please try again.");
      setAddingSavings(null);
      setRemovingSavings(null);
      return;
    }

    const numericSavings =
      currency === "IDR" ? displaySavings : displaySavings / rate;

    if (!numericSavings || numericSavings <= 0) {
      setErrorMessage("Savings amount must be greater than zero.");
      setAddingSavings(null);
      setRemovingSavings(null);
      return;
    }

    let newCurrentAmount: number;

    if (isAdding) {
      newCurrentAmount = goal.current_amount + numericSavings;

      if (newCurrentAmount > goal.target_amount) {
        setErrorMessage(
          `Savings would exceed the target by ${formatCurrency(
            newCurrentAmount - goal.target_amount
          )}.`
        );

        setAddingSavings(null);
        return;
      }
    } else {
      newCurrentAmount = goal.current_amount - numericSavings;

      if (newCurrentAmount < 0) {
        setErrorMessage(
          `You cannot remove more than the current savings of ${formatCurrency(
            goal.current_amount
          )}.`
        );

        setRemovingSavings(null);
        return;
      }
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setAddingSavings(null);
      setRemovingSavings(null);
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({
        current_amount: newCurrentAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setAddingSavings(null);
      setRemovingSavings(null);
      return;
    }

    setSavingsAmount("");
    setShowSavingsForm(null);
    setDirty(false);

    setMessage(
      isAdding
        ? "Savings added successfully."
        : "Savings removed successfully."
    );

    setAddingSavings(null);
    setRemovingSavings(null);

    await loadGoals();
  }

  function openDeleteModal(goal: Goal) {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setGoalToDelete(null);
  }

  async function confirmDeleteGoal() {
    if (!goalToDelete) {
      return;
    }

    setDeleting(goalToDelete.id);
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
      .from("goals")
      .delete()
      .eq("id", goalToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setDeleting(null);
      return;
    }

    setMessage("Goal deleted.");
    setDeleting(null);
    setShowDeleteModal(false);
    setGoalToDelete(null);

    await loadGoals();
  }

  const totalTarget = goals.reduce(
    (total, goal) => total + goal.target_amount,
    0
  );

  const totalCurrent = goals.reduce(
    (total, goal) => total + goal.current_amount,
    0
  );

  const totalRemaining = Math.max(
    totalTarget - totalCurrent,
    0
  );

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
                Ordiva Goals
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Financial Goals
              </h1>

              <p className="mt-3 text-lg text-[#5F7168]">
                Plan your goals and track your progress.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleCreateForm}
              disabled={hasReachedGoalLimit && !showForm}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(33,79,67,0.10)] transition ${
                hasReachedGoalLimit && !showForm
                  ? "cursor-not-allowed bg-[#DDE6D7] text-[#7B9685]"
                  : "bg-[#214F43] text-white hover:-translate-y-0.5 hover:bg-[#173C34]"
              }`}
            >
              {showForm
                ? "Cancel"
                : hasReachedGoalLimit
                ? "Goal Limit Reached"
                : "+ Create Goal"}
            </button>
          </div>

          {/* Plan Usage */}
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-[#DDE6D7] bg-white/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#214F43]">
                {isFreePlan
                  ? `${Math.min(goals.length, GOAL_LIMIT)} / ${GOAL_LIMIT} goals used`
                  : "Unlimited goals"}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                {isFreePlan
                  ? "Free plan includes up to 3 financial goals."
                  : "Premium plan includes unlimited financial goals."}
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
          {hasReachedGoalLimit && (
            <div className="mt-4 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3">
              <p className="text-sm font-semibold text-[#214F43]">
                You&apos;ve reached your Free plan limit.
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                Free users can create up to 3 goals. Premium will unlock
                unlimited financial goals.
              </p>
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
          {showForm && !hasReachedGoalLimit && (
            <div className="mt-6 rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-lg font-semibold">
                  Create a financial goal
                </p>

                <p className="mt-1 text-sm text-[#7B9685]">
                  Define a target and start tracking your progress.
                </p>
              </div>

              <form
                onSubmit={handleCreateGoal}
                className="grid gap-5 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label
                    htmlFor="goal-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Goal name
                  </label>

                  <input
                    id="goal-name"
                    type="text"
                    value={goalName}
                    onChange={(event) => {
                      setGoalName(event.target.value);
                      markFormDirty();
                    }}
                    placeholder="e.g. New Laptop"
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="goal-target"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Target amount ({currency})
                  </label>

                  <input
                    id="goal-target"
                    type="number"
                    min="1"
                    step="1"
                    value={targetAmount}
                    onChange={(event) => {
                      setTargetAmount(event.target.value);
                      markFormDirty();
                    }}
                    placeholder={currency === "IDR" ? "10000000" : "10000"}
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="goal-current"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Current amount ({currency})
                  </label>

                  <input
                    id="goal-current"
                    type="number"
                    min="0"
                    step="1"
                    value={currentAmount}
                    onChange={(event) => {
                      setCurrentAmount(event.target.value);
                      markFormDirty();
                    }}
                    placeholder="0"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="goal-date"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Target date
                    <span className="ml-1 font-normal text-[#7B9685]">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="goal-date"
                    type="date"
                    value={targetDate}
                    onChange={(event) => {
                      setTargetDate(event.target.value);
                      markFormDirty();
                    }}
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="goal-description"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Description
                    <span className="ml-1 font-normal text-[#7B9685]">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="goal-description"
                    type="text"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      markFormDirty();
                    }}
                    placeholder="e.g. Save for a new laptop"
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
                    {saving ? "Creating goal..." : "Create goal"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Summary */}
          <div className="mt-8 grid gap-x-5 gap-y-5 md:grid-cols-3">
            <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">Total Target</p>

              <p className="mt-3 text-2xl font-bold">
                {formatCurrency(totalTarget)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">Total Saved</p>

              <p className="mt-3 text-2xl font-bold">
                {formatCurrency(totalCurrent)}
              </p>
            </div>

            <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">Remaining</p>

              <p className="mt-3 text-2xl font-bold text-[#214F43]">
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>

          {/* Goal List */}
          <div className="mt-8">
            {loading || currencyLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-3xl border border-[#DDE6D7] bg-white/70 shadow-sm">
                <p className="text-sm text-[#7B9685]">
                  Loading your goals...
                </p>
              </div>
            ) : goals.length === 0 ? (
              <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-8 shadow-sm md:p-10">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EEDB] text-[#214F43]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-7 w-7"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3v18M5 8.5C5 6.57 6.79 5 9 5h6c2.21 0 4 1.57 4 3.5S17.21 12 15 12H9c-2.21 0-4 1.57-4 3.5S6.79 19 9 19h6c2.21 0 4-1.57 4-3.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-6 text-2xl font-bold tracking-tight text-[#173C34]">
                    Set something worth saving for.
                  </p>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#7B9685] md:text-base">
                    Turn your plans into measurable goals. Whether it&apos;s a
                    new laptop, emergency fund, trip, or something personal,
                    give your money a destination.
                  </p>

                  <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        01 · Choose a target
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Decide how much you need to reach your goal.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        02 · Set a timeline
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Add a target date to give your saving plan a deadline.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F9F8F2] p-4">
                      <p className="text-sm font-semibold text-[#214F43]">
                        03 · Track progress
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                        Update your savings as you move closer to the target.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateForm}
                    disabled={hasReachedGoalLimit}
                    className={`mt-8 rounded-2xl px-6 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(33,79,67,0.10)] transition ${
                      hasReachedGoalLimit
                        ? "cursor-not-allowed bg-[#DDE6D7] text-[#7B9685]"
                        : "bg-[#214F43] text-white hover:-translate-y-0.5 hover:bg-[#173C34]"
                    }`}
                  >
                    + Create Your First Goal
                  </button>

                  <p className="mt-4 text-xs text-[#7B9685]">
                    Start small. Consistency matters more than the amount.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {goals.map((goal) => {
                  const target = goal.target_amount;
                  const current = goal.current_amount;

                  const percentage =
                    target > 0 ? (current / target) * 100 : 0;

                  const progressWidth = Math.min(percentage, 100);

                  const remaining = Math.max(target - current, 0);

                  const isCompleted = current >= target;

                  return (
                    <div
                      key={goal.id}
                      className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm transition hover:shadow-md"
                    >
                      {/* Goal Header */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            {goal.name}
                          </p>

                          {goal.description && (
                            <p className="mt-1 text-sm text-[#7B9685]">
                              {goal.description}
                            </p>
                          )}
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(current)}
                          </p>

                          <p className="text-xs text-[#7B9685]">
                            of {formatCurrency(target)}
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Progress</span>

                          <span className="font-semibold">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#DDE6D7]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompleted
                                ? "bg-[#214F43]"
                                : "bg-[#7B9685]"
                            }`}
                            style={{
                              width: `${progressWidth}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Savings Form */}
                      {showSavingsForm === goal.id && (
                        <form
                          onSubmit={(event) =>
                            handleUpdateSavings(event, goal)
                          }
                          className="mt-6 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] p-4"
                        >
                          <div className="mb-4">
                            <p className="text-sm font-semibold">
                              {savingsMode === "add"
                                ? "Add savings"
                                : "Remove savings"}
                            </p>

                            <p className="mt-1 text-xs text-[#7B9685]">
                              {savingsMode === "add"
                                ? "Add money to this financial goal."
                                : "Remove money that was used for another expense."}
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              id={`savings-${goal.id}`}
                              type="number"
                              min="1"
                              step="1"
                              value={savingsAmount}
                              onChange={(event) => {
                                setSavingsAmount(event.target.value);
                                markFormDirty();
                              }}
                              placeholder={
                                currency === "IDR"
                                  ? "1000000"
                                  : "1000"
                              }
                              required
                              className="min-w-0 flex-1 rounded-2xl border border-[#DDE6D7] bg-white px-4 py-3 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                            />

                            <button
                              type="submit"
                              disabled={
                                addingSavings === goal.id ||
                                removingSavings === goal.id
                              }
                              className="rounded-2xl bg-[#214F43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {addingSavings === goal.id
                                ? "Adding..."
                                : removingSavings === goal.id
                                ? "Removing..."
                                : savingsMode === "add"
                                ? "Add Savings"
                                : "Remove Savings"}
                            </button>

                            <button
                              type="button"
                              onClick={closeSavingsForm}
                              className="rounded-2xl border border-[#DDE6D7] bg-white px-5 py-3 text-sm font-semibold text-[#214F43] transition hover:bg-[#F5F2E8]"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Footer */}
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#214F43]">
                            {isCompleted
                              ? "Goal completed!"
                              : `${formatCurrency(remaining)} remaining`}
                          </p>

                          <p className="mt-1 text-xs text-[#7B9685]">
                            Target date: {formatDate(goal.target_date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          {!isCompleted &&
                            showSavingsForm !== goal.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSavingsMode("add");
                                  setShowSavingsForm(goal.id);
                                  setSavingsAmount("");
                                  setMessage("");
                                  setErrorMessage("");
                                  setDirty(false);
                                }}
                                className="text-xs font-semibold text-[#214F43] transition hover:text-[#173C34]"
                              >
                                + Add Savings
                              </button>
                            )}

                          {showSavingsForm !== goal.id &&
                            current > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSavingsMode("remove");
                                  setShowSavingsForm(goal.id);
                                  setSavingsAmount("");
                                  setMessage("");
                                  setErrorMessage("");
                                  setDirty(false);
                                }}
                                className="text-xs font-semibold text-[#7B9685] transition hover:text-[#5F7168]"
                              >
                                − Remove Savings
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => openDeleteModal(goal)}
                            disabled={deleting === goal.id}
                            className="text-xs font-semibold text-red-600 transition hover:text-red-800"
                          >
                            {deleting === goal.id
                              ? "Deleting..."
                              : "Delete goal"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete this goal?"
        description={
          goalToDelete
            ? `You are about to delete "${goalToDelete.name}". This action cannot be undone.`
            : "This goal will be permanently deleted."
        }
        confirmLabel="Delete goal"
        cancelLabel="Keep goal"
        danger
        loading={Boolean(deleting)}
        onConfirm={confirmDeleteGoal}
        onCancel={closeDeleteModal}
      />
    </>
  );
}