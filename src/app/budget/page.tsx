"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import PageHero, { heroButton } from "@/components/app/PageHero";
import ConfirmModal from "@/components/ConfirmModal";
import { useCurrency } from "@/hooks/useCurrency";
import { todayLocal } from "@/lib/date";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";
import CategoryCreateModal, { CreatedCategory } from "@/components/CategoryCreateModal";

type Category = {
  id: string;
  name: string;
  type: string;
};

type Budget = {
  id: string;
  category_id: string;
  name: string;
  amount: number;
  month: string;
  is_recurring: boolean;
};

type Transaction = {
  category_id: string | null;
  type: string;
  amount: number;
  transaction_date: string;
};

type BudgetDisplay = Budget & {
  categoryName: string;
  spent: number;
  remaining: number;
  percentage: number;
};

export default function BudgetPage() {
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
  const [deleting, setDeleting] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetDisplay[]>([]);

  const [plan, setPlan] = useState<"free" | "premium">("free");

  const [selectedMonth, setSelectedMonth] = useState(
    todayLocal().slice(0, 7)
  );

  const [showForm, setShowForm] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetName, setBudgetName] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] =
    useState<BudgetDisplay | null>(null);

  const BUDGET_LIMIT = 5;
  const isFreePlan = plan === "free";

  const hasReachedBudgetLimit =
    isFreePlan && budgets.length >= BUDGET_LIMIT;

  function formatMonth(month: string) {
    const date = new Date(`${month}-01T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function getDatabaseMonth(month: string) {
    return `${month}-01`;
  }

  function getMonthRange(month: string) {
    const [year, monthNumber] = month.split("-").map(Number);

    const startDate = `${year}-${String(monthNumber).padStart(
      2,
      "0"
    )}-01`;

    const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
    const nextYear = monthNumber === 12 ? year + 1 : year;

    const endDate = `${nextYear}-${String(nextMonth).padStart(
      2,
      "0"
    )}-01`;

    return {
      startDate,
      endDate,
    };
  }

  async function loadBudgetData() {
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

    const { startDate, endDate } =
      getMonthRange(selectedMonth);

    const databaseMonth =
      getDatabaseMonth(selectedMonth);

    const [
      profileResult,
      categoriesResult,
      budgetsResult,
      transactionsResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single(),

      supabase
        .from("categories")
        .select("id, name, type")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .order("name", { ascending: true }),

      supabase
        .from("budgets")
        .select(
          "id, category_id, name, amount, month, is_recurring"
        )
        .eq("user_id", user.id)
        .lte("month", databaseMonth)
        .order("created_at", { ascending: true }),

      supabase
        .from("transactions")
        .select(
          "category_id, type, amount, transaction_date"
        )
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate),
    ]);

    if (profileResult.error) {
      setErrorMessage(profileResult.error.message);
      setLoading(false);
      return;
    }

    if (categoriesResult.error) {
      setErrorMessage(categoriesResult.error.message);
      setLoading(false);
      return;
    }

    if (budgetsResult.error) {
      setErrorMessage(budgetsResult.error.message);
      setLoading(false);
      return;
    }

    if (transactionsResult.error) {
      setErrorMessage(transactionsResult.error.message);
      setLoading(false);
      return;
    }

    const currentPlan =
      profileResult.data?.plan === "premium"
        ? "premium"
        : "free";

    const loadedCategories: Category[] =
      (categoriesResult.data ?? []).map((category) => ({
        id: String(category.id),
        name: String(category.name),
        type: String(category.type),
      }));

    const allLoadedBudgets: Budget[] = (
      budgetsResult.data ?? []
    ).map((budget) => ({
      id: String(budget.id),
      category_id: String(budget.category_id),
      name: String(budget.name),
      amount: Number(budget.amount),
      month: String(budget.month).slice(0, 7),
      is_recurring: Boolean(budget.is_recurring),
    }));

    const loadedBudgets = allLoadedBudgets.filter(
      (budget) =>
        budget.month === selectedMonth ||
        budget.is_recurring
    );

    const transactions: Transaction[] = (
      transactionsResult.data ?? []
    ).map((transaction) => ({
      category_id: transaction.category_id
        ? String(transaction.category_id)
        : null,
      type: String(transaction.type),
      amount: Number(transaction.amount),
      transaction_date: String(
        transaction.transaction_date
      ),
    }));

    const budgetByCategory = new Map<
      string,
      Budget
    >();

    for (const budget of loadedBudgets) {
      const existing =
        budgetByCategory.get(budget.category_id);

      if (!existing) {
        budgetByCategory.set(
          budget.category_id,
          budget
        );
        continue;
      }

      const budgetIsCurrentMonth =
        budget.month === selectedMonth;

      const existingIsCurrentMonth =
        existing.month === selectedMonth;

      if (
        budgetIsCurrentMonth &&
        !existingIsCurrentMonth
      ) {
        budgetByCategory.set(
          budget.category_id,
          budget
        );
        continue;
      }

      if (
        budgetIsCurrentMonth ===
          existingIsCurrentMonth &&
        budget.month > existing.month
      ) {
        budgetByCategory.set(
          budget.category_id,
          budget
        );
      }
    }

    const activeBudgets = Array.from(
      budgetByCategory.values()
    );

    const displayData: BudgetDisplay[] =
      activeBudgets.map((budget) => {
        const category = loadedCategories.find(
          (item) => item.id === budget.category_id
        );

        const spent = transactions
          .filter(
            (transaction) =>
              transaction.category_id ===
              budget.category_id
          )
          .reduce(
            (total, transaction) =>
              total + transaction.amount,
            0
          );

        const remaining =
          budget.amount - spent;

        const percentage =
          budget.amount > 0
            ? (spent / budget.amount) * 100
            : 0;

        return {
          ...budget,
          categoryName:
            category?.name ?? "Unknown category",
          spent,
          remaining,
          percentage,
        };
      });

    setPlan(currentPlan);
    setCategories(loadedCategories);
    setBudgets(displayData);
    setLoading(false);
  }

  useEffect(() => {
    // Async data loading intentionally updates UI state after the external request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBudgetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  function markFormDirty() {
    setDirty(true);
  }

  function resetForm() {
    setCategoryId("");
    setBudgetAmount("");
    setBudgetName("");
    setIsRecurring(false);
    setShowForm(false);
    setDirty(false);
  }

  function openCreateForm() {
    if (hasReachedBudgetLimit) {
      setMessage("");
      setErrorMessage(
        "You&apos;ve reached your Free plan limit. Free users can have up to 5 active budgets per month."
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

  async function handleCreateBudget(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (hasReachedBudgetLimit) {
      setErrorMessage(
        "You&apos;ve reached your Free plan limit. Free users can have up to 5 active budgets per month."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!categoryId) {
      setErrorMessage("Please select a category.");
      setSaving(false);
      return;
    }

    const displayAmount = Number(budgetAmount);

    if (
      !displayAmount ||
      displayAmount <= 0 ||
      !Number.isFinite(displayAmount)
    ) {
      setErrorMessage(
        "Budget amount must be greater than zero."
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

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
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
      setErrorMessage(
        "Please enter a valid budget amount."
      );
      setSaving(false);
      return;
    }

    const selectedCategory = categories.find(
      (category) => category.id === categoryId
    );

    const finalName =
      budgetName.trim() ||
      `${selectedCategory?.name ?? "Category"} Budget`;

    const databaseMonth =
      getDatabaseMonth(selectedMonth);

    const { error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        category_id: categoryId,
        name: finalName,
        amount: numericAmount,
        month: databaseMonth,
        is_recurring: isRecurring,
      });

    if (error) {
      if (
        error.message.includes(
          "Free plan limit reached"
        )
      ) {
        setErrorMessage(
          "You&apos;ve reached your Free plan limit. Free users can have up to 5 active budgets per month."
        );
      } else if (error.code === "23505") {
        setErrorMessage(
          "A budget for this category already exists for this month."
        );
      } else {
        setErrorMessage(error.message);
      }

      setSaving(false);
      return;
    }

    resetForm();

    setMessage(
      isRecurring
        ? "Recurring budget created successfully."
        : "Budget created successfully."
    );

    setSaving(false);

    await loadBudgetData();
  }

  function openDeleteModal(
    budget: BudgetDisplay
  ) {
    setBudgetToDelete(budget);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setBudgetToDelete(null);
  }

  async function confirmDeleteBudget() {
    if (!budgetToDelete) {
      return;
    }

    setDeleting(budgetToDelete.id);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budgetToDelete.id)
      .eq(
        "user_id",
        (await supabase.auth.getUser()).data.user?.id ??
          ""
      );

    if (error) {
      setErrorMessage(error.message);
      setDeleting(null);
      return;
    }

    setMessage(
      budgetToDelete.is_recurring
        ? "Recurring budget deleted."
        : "Budget deleted."
    );

    setDeleting(null);
    setShowDeleteModal(false);
    setBudgetToDelete(null);

    await loadBudgetData();
  }

  const totalBudget = budgets.reduce(
    (total, budget) =>
      total + budget.amount,
    0
  );

  const totalSpent = budgets.reduce(
    (total, budget) =>
      total + budget.spent,
    0
  );

  const totalRemaining =
    totalBudget - totalSpent;

  const availableCategories =
    categories.filter(
      (category) =>
        !budgets.some(
          (budget) =>
            budget.category_id === category.id
        )
    );

  return (
    <>

      <Navigation />

      <main className="relative min-h-screen bg-[#F5F2E8] text-[#173C34]">
        <div className="app-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-12">

          {/* HEADER */}

          <PageHero
            eyebrow="Budget"
            title="Spend with"
            accent="intention."
            description="Plan your spending and stay on track."
            actions={
              <button
                type="button"
                onClick={toggleCreateForm}
                disabled={hasReachedBudgetLimit && !showForm}
                className={heroButton}
              >
                {showForm ? "Cancel" : hasReachedBudgetLimit ? "Budget Limit Reached" : "+ Create Budget"}
              </button>
            }
          />

          {/* MONTH */}

          <div className="mt-8 flex flex-col gap-4 border-b border-[#DDE6D7] pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {formatMonth(selectedMonth)}
              </p>

              <p className="mt-1 text-sm text-[#7B9685]">
                Your monthly spending plan.
              </p>
            </div>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setDirty(false);
                setMessage("");
                setErrorMessage("");
              }}
              className="rounded-2xl border border-[#DDE6D7] bg-white/70 px-4 py-3 text-sm outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
            />
          </div>

          {/* PLAN USAGE */}

          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-[#DDE6D7] bg-white/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#214F43]">
                {isFreePlan
                  ? `${Math.min(
                      budgets.length,
                      BUDGET_LIMIT
                    )} / ${BUDGET_LIMIT} budgets used`
                  : "Unlimited budgets"}
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                {isFreePlan
                  ? "Free plan includes up to 5 active budgets per month."
                  : "Premium plan includes unlimited budgets."}
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

          {/* LIMIT NOTICE */}

          {hasReachedBudgetLimit && (
            <div className="mt-4 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3">
              <p className="text-sm font-semibold text-[#214F43]">
                You&apos;ve reached your Free plan limit.
              </p>

              <p className="mt-1 text-xs text-[#7B9685]">
                Free users can have up to 5 active
                budgets per month. Premium will unlock
                unlimited budgets.
              </p>
            </div>
          )}

          {/* MESSAGES */}

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

          {/* CREATE FORM */}

          {showForm &&
            !hasReachedBudgetLimit && (
              <div className="mt-6 app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm sm:p-7">
                <div className="mb-6">
                  <p className="text-lg font-semibold">
                    Create a budget
                  </p>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Set a spending limit and decide
                    whether it repeats every month.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateBudget}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="budget-category"
                        className="block text-sm font-semibold"
                      >
                        Category
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setCategoryModalOpen(true);
                          setMessage("");
                          setErrorMessage("");
                        }}
                        className="text-xs font-semibold text-[#214F43] hover:text-[#173C34]"
                      >
                        + New category
                      </button>
                    </div>

                    <select
                      id="budget-category"
                      value={categoryId}
                      onChange={(event) => {
                        setCategoryId(event.target.value);
                        markFormDirty();
                      }}
                      required
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    >
                      <option value="">Select category</option>

                      {availableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {availableCategories.length === 0 && (
                      <p className="mt-2 text-xs text-[#7B9685]">
                        All expense categories already have a budget for this
                        month. You can still create a new personal category.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="budget-amount"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Monthly limit ({currency})
                    </label>

                    <input
                      id="budget-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={budgetAmount}
                      onChange={(event) => {
                        setBudgetAmount(
                          event.target.value
                        );
                        markFormDirty();
                      }}
                      placeholder={
                        currency === "IDR"
                          ? "1000000"
                          : "100"
                      }
                      required
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    />

                    <p className="mt-2 text-xs text-[#7B9685]">
                      Stored in IDR and converted
                      automatically.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="budget-name"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Budget name
                      <span className="ml-1 font-normal text-[#7B9685]">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="budget-name"
                      type="text"
                      value={budgetName}
                      onChange={(event) => {
                        setBudgetName(
                          event.target.value
                        );
                        markFormDirty();
                      }}
                      placeholder="e.g. Monthly Food Budget"
                      className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div
                      className={`rounded-2xl border p-4 transition ${
                        isRecurring
                          ? "border-[#AFC1A4] bg-[#E8EEDB]/60"
                          : "border-[#DDE6D7] bg-[#F9F8F2]"
                      }`}
                    >
                      <label
                        htmlFor="budget-recurring"
                        className="flex cursor-pointer items-start gap-3"
                      >
                        <input
                          id="budget-recurring"
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(event) => {
                            setIsRecurring(
                              event.target.checked
                            );
                            markFormDirty();
                          }}
                          className="mt-1 h-4 w-4 accent-[#214F43]"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-[#214F43]">
                            Repeat this budget every
                            month
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-[#7B9685]">
                            This budget will start in{" "}
                            {formatMonth(
                              selectedMonth
                            )}{" "}
                            and automatically apply to
                            future months until you delete
                            it.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !categoryId ||
                        availableCategories.length ===
                          0 ||
                        (currency !== "IDR" &&
                          (!Number.isFinite(rate) ||
                            rate <= 0))
                      }
                      className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Creating budget..."
                        : isRecurring
                        ? "Create recurring budget"
                        : "Create budget"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          {/* SUMMARY */}

          <div className="mt-8 grid gap-y-5 gap-x-5 md:grid-cols-3">
            <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Total Budget
              </p>

              <p className="mt-3 text-2xl font-bold">
                {formatCurrency(totalBudget)}
              </p>
            </div>

            <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Total Spent
              </p>

              <p className="mt-3 text-2xl font-bold">
                {formatCurrency(totalSpent)}
              </p>
            </div>

            <div className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <p className="text-sm text-[#7B9685]">
                Remaining
              </p>

              <p
                className={`mt-3 text-2xl font-bold ${
                  totalRemaining < 0
                    ? "text-red-700"
                    : "text-[#214F43]"
                }`}
              >
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>

          {/* BUDGET LIST */}

          <div className="mt-8">
            {loading || currencyLoading ? (
              <div role="status" aria-label="Loading your budgets" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-4 rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6">
                    <div className="skeleton h-5 w-1/2 rounded-full" />
                    <div className="skeleton h-9 w-2/3 rounded-xl" />
                    <div className="skeleton h-2.5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : budgets.length === 0 ? (

              /* ==========================================
                 EMPTY STATE
              ========================================== */

              <div className="flex min-h-[420px] items-center justify-center app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 text-center shadow-sm">
                <div className="max-w-sm">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[#E8EEDB] text-2xl text-[#214F43] shadow-sm">
                    ◇
                  </div>

                  <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7B9685]">
                    {formatMonth(selectedMonth)}
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                    Give your money a plan.
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#5F7168]">
                    Create a budget to set spending
                    limits and keep your monthly spending
                    on track.
                  </p>

                  <button
                    type="button"
                    onClick={openCreateForm}
                    disabled={
                      hasReachedBudgetLimit
                    }
                    className={`mt-7 rounded-full px-6 py-3 text-sm font-semibold shadow-[0_10px_28px_rgba(33,79,67,0.14)] transition ${
                      hasReachedBudgetLimit
                        ? "cursor-not-allowed bg-[#DDE6D7] text-[#7B9685]"
                        : "bg-[#214F43] text-white hover:-translate-y-0.5 hover:bg-[#173C34]"
                    }`}
                  >
                    Create your first budget
                    <span className="ml-2">
                      →
                    </span>
                  </button>

                  <div className="mx-auto mt-7 max-w-xs border-t border-[#DDE6D7] pt-5">
                    <p className="text-[11px] leading-5 text-[#8B9A92]">
                      Budgets help you understand how much
                      you can spend before the month gets
                      away from you.
                    </p>
                  </div>
                </div>
              </div>

            ) : (
              <div className="space-y-5">
                {budgets.map((budget) => {
                  const isOverBudget =
                    budget.spent >
                    budget.amount;

                  const progressWidth =
                    Math.min(
                      budget.percentage,
                      100
                    );

                  return (
                    <div
                      key={budget.id}
                      className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold">
                              {budget.categoryName}
                            </p>

                            {budget.is_recurring && (
                              <span className="rounded-full bg-[#E8EEDB] px-2.5 py-1 text-[11px] font-semibold text-[#214F43]">
                                Every month
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-[#7B9685]">
                            {budget.name}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(
                              budget.spent
                            )}
                          </p>

                          <p className="text-xs text-[#7B9685]">
                            of{" "}
                            {formatCurrency(
                              budget.amount
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">
                            Spending
                          </span>

                          <span className="font-semibold">
                            {budget.percentage.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-[#DDE6D7]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOverBudget
                                ? "bg-red-400"
                                : "bg-[#7B9685]"
                            }`}
                            style={{
                              width: `${progressWidth}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isOverBudget
                                ? "text-red-700"
                                : "text-[#214F43]"
                            }`}
                          >
                            {isOverBudget
                              ? `${formatCurrency(
                                  Math.abs(
                                    budget.remaining
                                  )
                                )} over budget`
                              : `${formatCurrency(
                                  budget.remaining
                                )} remaining`}
                          </p>

                          <p className="mt-1 text-xs text-[#7B9685]">
                            {budget.is_recurring
                              ? `Started ${formatMonth(
                                  budget.month
                                )} · repeats monthly`
                              : formatMonth(
                                  budget.month
                                )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openDeleteModal(
                              budget
                            )
                          }
                          disabled={
                            deleting ===
                            budget.id
                          }
                          className="text-left text-xs font-semibold text-red-600 transition hover:text-red-800 sm:text-right"
                        >
                          {deleting === budget.id
                            ? "Deleting..."
                            : budget.is_recurring
                            ? "Delete recurring budget"
                            : "Delete budget"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <CategoryCreateModal
        open={categoryModalOpen}
        defaultType="expense"
        allowTypeSelection={false}
        onClose={() => setCategoryModalOpen(false)}
        onCreated={(createdCategory: CreatedCategory) => {
          setCategories((current) =>
            [...current, createdCategory].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
          setCategoryId(createdCategory.id);
          setDirty(true);
          setMessage("Category created and selected.");
          setErrorMessage("");
        }}
      />

      <ConfirmModal
        open={showDeleteModal}
        title={
          budgetToDelete?.is_recurring
            ? "Delete this recurring budget?"
            : "Delete this budget?"
        }
        description={
          budgetToDelete
            ? budgetToDelete.is_recurring
              ? `"${budgetToDelete.name}" will stop applying to future months. This action cannot be undone.`
              : `You are about to delete "${budgetToDelete.name}". This action cannot be undone.`
            : "This budget will be permanently deleted."
        }
        confirmLabel={
          budgetToDelete?.is_recurring
            ? "Delete recurring budget"
            : "Delete budget"
        }
        cancelLabel="Keep budget"
        danger
        loading={Boolean(deleting)}
        onConfirm={confirmDeleteBudget}
        onCancel={closeDeleteModal}
      />
    </>
  );
}