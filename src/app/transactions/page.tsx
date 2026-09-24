"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import PageHero, { HeroStat, heroButton } from "@/components/app/PageHero";
import PageLoader from "@/components/app/PageLoader";
import Segmented from "@/components/app/Segmented";
import { featureIcons } from "@/components/landing/icons";
import ConfirmModal from "@/components/ConfirmModal";
import { useCurrency } from "@/hooks/useCurrency";
import { todayLocal } from "@/lib/date";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";
import CategoryCreateModal, { CreatedCategory } from "@/components/CategoryCreateModal";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string | null;
  need_want: string | null;
  notes: string | null;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string | null;
  color?: string | null;
};

export default function TransactionsPage() {
  const router = useRouter();
  const { setDirty } = useUnsavedChanges();

  const {
    currency,
    rate,
    format: formatCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [type, setType] =
    useState<"income" | "expense">("expense");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [transactionDate, setTransactionDate] = useState(
    todayLocal()
  );

  const [paymentMethod, setPaymentMethod] = useState("");
  const [needWant, setNeedWant] = useState("");
  const [notes, setNotes] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const [
        transactionsResult,
        categoriesResult,
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select(
            "id, type, amount, description, transaction_date, payment_method, need_want, notes, category_id"
          )
          .order("transaction_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("categories")
          .select("id, name, type, icon, color")
          .order("name", {
            ascending: true,
          }),
      ]);

      if (transactionsResult.error) {
        setMessage(transactionsResult.error.message);
      } else {
        setTransactions(transactionsResult.data || []);
      }

      if (categoriesResult.error) {
        setMessage(categoriesResult.error.message);
      } else {
        setCategories(categoriesResult.data || []);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  useEffect(() => {
    if (!editingId) {
      // Reset dependent form state when the transaction type changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryId("");
    }
  }, [type, editingId]);

  function markFormDirty() {
    setDirty(true);
  }

  function resetForm() {
    setEditingId(null);
    setType("expense");
    setCategoryId("");
    setAmount("");
    setDescription("");

    setTransactionDate(
      todayLocal()
    );

    setPaymentMethod("");
    setNeedWant("");
    setNotes("");

    setDirty(false);
  }

  function scrollToTransactionForm() {
    document
      .getElementById("transaction-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function startEditing(transaction: Transaction) {
    setEditingId(transaction.id);
    setType(transaction.type);
    setCategoryId(transaction.category_id || "");

    const displayAmount =
      currency === "IDR"
        ? Number(transaction.amount)
        : Number(transaction.amount) * rate;

    setAmount(String(displayAmount));

    setDescription(transaction.description);
    setTransactionDate(transaction.transaction_date);

    setPaymentMethod(
      transaction.payment_method || ""
    );

    setNeedWant(transaction.need_want || "");
    setNotes(transaction.notes || "");
    setMessage("");

    setDirty(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setSaving(false);
      return;
    }

    const displayAmount = Number(amount);

    if (
      !displayAmount ||
      displayAmount <= 0 ||
      !Number.isFinite(displayAmount)
    ) {
      setMessage("Please enter a valid amount.");
      setSaving(false);
      return;
    }

    if (
      currency !== "IDR" &&
      (!Number.isFinite(rate) || rate <= 0)
    ) {
      setMessage(
        "Exchange rate is unavailable. Please try again."
      );
      setSaving(false);
      return;
    }

    if (!categoryId) {
      setMessage("Please select a category.");
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
      setMessage("Please enter a valid amount.");
      setSaving(false);
      return;
    }

    const transactionData = {
      category_id: categoryId,
      type,
      amount: numericAmount,
      description,
      transaction_date: transactionDate,
      payment_method: paymentMethod || null,
      need_want: needWant || null,
      notes: notes || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("transactions")
        .update(transactionData)
        .eq("id", editingId)
        .eq("user_id", user.id)
        .select(
          "id, type, amount, description, transaction_date, payment_method, need_want, notes, category_id"
        )
        .single();

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      if (data) {
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === editingId
              ? data
              : transaction
          )
        );
      }

      resetForm();

      setMessage(
        "Transaction updated successfully."
      );

      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        ...transactionData,
      })
      .select(
        "id, type, amount, description, transaction_date, payment_method, need_want, notes, category_id"
      )
      .single();

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    if (data) {
      setTransactions((current) => [
        data,
        ...current,
      ]);
    }

    resetForm();

    setMessage(
      "Transaction added successfully."
    );

    setSaving(false);
  }

  function openDeleteModal(id: string) {
    setDeletingId(id);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;

    setDeleteModalOpen(false);
    setDeletingId(null);
  }

  async function confirmDelete() {
    if (!deletingId) return;

    setDeleting(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDeletingId(null);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deletingId)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    setTransactions((current) =>
      current.filter(
        (transaction) =>
          transaction.id !== deletingId
      )
    );

    if (editingId === deletingId) {
      resetForm();
    }

    setDeleteModalOpen(false);
    setDeletingId(null);
    setDeleting(false);

    setMessage(
      "Transaction deleted successfully."
    );
  }

  if (loading || currencyLoading) {
    return <PageLoader label="Loading your transactions..." />;
  }

  const transactionToDelete = transactions.find(
    (transaction) => transaction.id === deletingId
  );

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  // This month's totals for the hero.
  const thisMonth = todayLocal().slice(0, 7);
  let monthIncome = 0;
  let monthExpense = 0;
  for (const transaction of transactions) {
    if (!transaction.transaction_date.startsWith(thisMonth)) continue;
    if (transaction.type === "income") monthIncome += Number(transaction.amount);
    else monthExpense += Number(transaction.amount);
  }
  const monthNet = monthIncome - monthExpense;

  // Search + type filter, then group by date (list is already newest first).
  const query = search.trim().toLowerCase();
  const visibleTransactions = transactions.filter((transaction) => {
    if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
    if (!query) return true;
    const categoryName = transaction.category_id
      ? categoryById.get(transaction.category_id)?.name ?? ""
      : "";
    return (
      transaction.description.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query)
    );
  });
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const transaction of visibleTransactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === transaction.transaction_date) last.items.push(transaction);
    else groups.push({ date: transaction.transaction_date, items: [transaction] });
  }

  const inputClass =
    "w-full rounded-2xl border border-line bg-[#F9F8F2] px-4 py-3.5 outline-none transition hover:border-mint focus:border-forest focus:bg-white focus:ring-4 focus:ring-forest/10";

  return (
    <>
      <Navigation />

      <main className="relative min-h-screen bg-cream text-ink">
        <div className="app-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-12">
          <PageHero
            eyebrow="Transactions"
            title="Every transaction,"
            accent="in its place."
            description="Track your income and expenses, and see where your money goes."
            actions={
              <button type="button" onClick={scrollToTransactionForm} className={heroButton}>
                <span className="text-base leading-none transition-transform duration-300 group-hover:rotate-90">+</span>
                New transaction
              </button>
            }
            aside={
              <HeroStat
                label="Net this month"
                value={`${monthNet < 0 ? "-" : "+"} ${formatCurrency(Math.abs(monthNet))}`}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-white/50">Money in</p>
                    <p className="mt-1 font-semibold break-words text-mint">{formatCurrency(monthIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/50">Money out</p>
                    <p className="mt-1 font-semibold break-words text-white">{formatCurrency(monthExpense)}</p>
                  </div>
                </div>
              </HeroStat>
            }
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
            {/* ADD / EDIT */}
            <section
              id="transaction-form"
              className={`app-card scroll-mt-28 rounded-[1.75rem] border bg-white/70 p-5 sm:p-6 ${
                editingId ? "border-forest/40 ring-4 ring-forest/5" : "border-line"
              }`}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">
                    {editingId ? "Edit transaction" : "Add transaction"}
                  </h2>
                  <p className="mt-1 text-sm text-sage">
                    {editingId ? "Update your transaction details." : "Record your latest financial activity."}
                  </p>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-slate transition hover:bg-mist hover:text-forest"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold">Transaction type</p>
                  <Segmented
                    value={type}
                    options={[
                      { value: "expense", label: "Expense" },
                      { value: "income", label: "Income" },
                    ]}
                    onChange={(value) => {
                      setType(value as "income" | "expense");
                      markFormDirty();
                    }}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="category" className="block text-sm font-semibold">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryModalOpen(true);
                        setMessage("");
                      }}
                      className="rounded-full px-2 py-1 text-xs font-semibold text-forest transition hover:bg-mist"
                    >
                      + New category
                    </button>
                  </div>

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      markFormDirty();
                    }}
                    required
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon ? `${category.icon}  ` : ""}
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {filteredCategories.length === 0 && (
                    <p className="mt-2 text-xs text-sage">No {type} categories yet. Create your first one.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="amount" className="mb-2 block text-sm font-semibold">
                    Amount ({currency})
                  </label>
                  <input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      markFormDirty();
                    }}
                    placeholder={currency === "IDR" ? "50000" : "50"}
                    required
                    className={`${inputClass} text-lg font-semibold tabular-nums`}
                  />
                  <p className="mt-2 text-xs text-sage">Amounts are stored securely in IDR and converted automatically.</p>
                </div>

                <div>
                  <label htmlFor="description" className="mb-2 block text-sm font-semibold">
                    Description
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      markFormDirty();
                    }}
                    placeholder="Lunch, salary, transport..."
                    required
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <label htmlFor="transactionDate" className="mb-2 block text-sm font-semibold">
                      Date
                    </label>
                    <input
                      id="transactionDate"
                      type="date"
                      value={transactionDate}
                      onChange={(e) => {
                        setTransactionDate(e.target.value);
                        markFormDirty();
                      }}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="paymentMethod" className="mb-2 block text-sm font-semibold">
                      Payment method
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        markFormDirty();
                      }}
                      className={inputClass}
                    >
                      <option value="">Select method</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="debit_card">Debit card</option>
                      <option value="credit_card">Credit card</option>
                      <option value="e_wallet">E-wallet</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Need or want?</p>
                  <Segmented
                    value={needWant}
                    options={[
                      { value: "need", label: "Need" },
                      { value: "want", label: "Want" },
                    ]}
                    onChange={(value) => {
                      setNeedWant(value);
                      markFormDirty();
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="mb-2 block text-sm font-semibold">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      markFormDirty();
                    }}
                    placeholder="Optional notes..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {message && (
                  <div role="status" className="menu-pop rounded-2xl bg-mist px-4 py-3 text-sm text-forest">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || (currency !== "IDR" && (!Number.isFinite(rate) || rate <= 0))}
                  className="w-full rounded-2xl bg-forest px-5 py-3.5 font-semibold text-white shadow-[0_12px_28px_rgba(33,79,67,0.22)] transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving
                    ? editingId
                      ? "Updating..."
                      : "Adding..."
                    : editingId
                    ? "Update transaction"
                    : "Add transaction"}
                </button>
              </form>
            </section>

            {/* TRANSACTION LIST */}
            <section className="app-card min-w-0 rounded-[1.75rem] border border-line bg-white/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">Recent transactions</h2>
                  <p className="mt-1 text-sm text-sage">Your latest financial activity.</p>
                </div>
                <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest tabular-nums">
                  {visibleTransactions.length === transactions.length
                    ? `${transactions.length} total`
                    : `${visibleTransactions.length} of ${transactions.length}`}
                </span>
              </div>

              {transactions.length > 0 && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <label className="relative flex-1">
                    <span className="sr-only">Search transactions</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-sage"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search description or category"
                      className="w-full rounded-full border border-line bg-[#F9F8F2] py-2.5 pr-4 pl-10 text-sm outline-none transition hover:border-mint focus:border-forest focus:bg-white focus:ring-4 focus:ring-forest/10"
                    />
                  </label>
                  <div className="sm:w-64">
                    <Segmented
                      small
                      value={typeFilter}
                      options={[
                        { value: "all", label: "All" },
                        { value: "income", label: "Income" },
                        { value: "expense", label: "Expense" },
                      ]}
                      onChange={(value) => setTypeFilter(value as "all" | "income" | "expense")}
                    />
                  </div>
                </div>
              )}

              {transactions.length === 0 ? (
                <div className="mt-6 flex min-h-[430px] items-center justify-center rounded-2xl bg-[#F9F8F2] px-6 py-10">
                  <div className="max-w-sm text-center">
                    <div className="float mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-mist text-forest shadow-sm [&_svg]:h-6 [&_svg]:w-6">
                      {featureIcons.transactions}
                    </div>
                    <p className="mt-7 text-[10px] font-semibold tracking-[0.22em] text-sage uppercase">
                      Your financial space is ready
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                      Start with your first <span className="font-serif font-normal italic">transaction.</span>
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate">
                      Record an income or expense to start understanding where your money goes.
                    </p>
                    <button
                      type="button"
                      onClick={scrollToTransactionForm}
                      className="mt-7 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(33,79,67,0.14)] transition hover:-translate-y-0.5 hover:bg-ink"
                    >
                      Add your first transaction
                    </button>
                  </div>
                </div>
              ) : groups.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-[#F9F8F2] px-6 py-12 text-center">
                  <p className="font-semibold">No transactions match.</p>
                  <p className="mt-1 text-sm text-sage">Try a different search or filter.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {groups.map((group) => (
                    <div key={group.date}>
                      <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.16em] text-sage uppercase">
                        {formatDayLabel(group.date)}
                      </p>
                      <div className="app-list space-y-2">
                        {group.items.map((transaction) => {
                          const category = transaction.category_id
                            ? categoryById.get(transaction.category_id)
                            : undefined;
                          const income = transaction.type === "income";
                          const tint =
                            category?.color && /^#[0-9a-f]{6}$/i.test(category.color)
                              ? `${category.color}40`
                              : undefined;

                          return (
                            <div
                              key={transaction.id}
                              className={`group flex items-center gap-3 rounded-2xl border p-3 transition duration-300 hover:border-line hover:bg-white hover:shadow-[0_12px_30px_-18px_rgba(23,60,52,0.3)] sm:gap-4 sm:p-3.5 ${
                                editingId === transaction.id ? "border-forest/40 bg-white" : "border-transparent bg-[#F9F8F2]"
                              }`}
                            >
                              <span
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist text-lg transition-transform duration-300 group-hover:scale-105"
                                style={tint ? { background: tint } : undefined}
                                aria-hidden="true"
                              >
                                {category?.icon || (category?.name ?? "?").charAt(0)}
                              </span>

                              {/* Mobile: amount sits under the description so the name has room. */}
                              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold">{transaction.description}</p>
                                  <p className="mt-0.5 truncate text-xs text-sage">
                                    {category?.name || "Uncategorized"}
                                    {transaction.payment_method
                                      ? ` · ${transaction.payment_method.replace("_", " ")}`
                                      : ""}
                                    {transaction.need_want ? ` · ${transaction.need_want}` : ""}
                                  </p>
                                </div>

                                <p
                                  className={`mt-1 shrink-0 text-sm font-semibold tabular-nums sm:mt-0 sm:text-right sm:text-lg ${
                                    income ? "text-forest" : "text-ink"
                                  }`}
                                >
                                  {income ? "+" : "-"} {formatCurrency(Number(transaction.amount))}
                                </p>
                              </div>

                              <div className="flex shrink-0 gap-1 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <IconButton label={`Edit ${transaction.description}`} onClick={() => startEditing(transaction)}>
                                  <path d="M16.9 4.6a2 2 0 0 1 2.8 2.8L8 19.1l-4 1 1-4Z" />
                                </IconButton>
                                <IconButton danger label={`Delete ${transaction.description}`} onClick={() => openDeleteModal(transaction.id)}>
                                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                                </IconButton>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <CategoryCreateModal
        open={categoryModalOpen}
        defaultType={type}
        allowTypeSelection={true}
        onClose={() => setCategoryModalOpen(false)}
        onCreated={(createdCategory: CreatedCategory) => {
          setCategories((current) =>
            [...current.filter((category) => category.id !== createdCategory.id), createdCategory]
              .sort((a, b) => a.name.localeCompare(b.name))
          );

          if (createdCategory.type === type) {
            setCategoryId(createdCategory.id);
            setMessage("Category created and selected.");
          } else {
            setCategoryId("");
            setMessage(
              `Category "${createdCategory.name}" created as ${createdCategory.type}.`
            );
          }

          setDirty(true);
        }}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete this transaction?"
        description={
          transactionToDelete
            ? `"${transactionToDelete.description}" will be permanently removed from your financial records. This action cannot be undone.`
            : "This transaction will be permanently removed from your financial records. This action cannot be undone."
        }
        confirmLabel="Delete transaction"
        cancelLabel="Keep transaction"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </>
  );
}

function formatDayLabel(date: string) {
  const today = todayLocal();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === today) return "Today";
  if (date === todayLocal(yesterday)) return "Yesterday";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric",
  });
}

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label.split(" ")[0]}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white transition hover:-translate-y-0.5 ${
        danger ? "text-red-700 hover:border-[#E8D7D7] hover:bg-[#FDECEC]" : "text-forest hover:bg-mist"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
