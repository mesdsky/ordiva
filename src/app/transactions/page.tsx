"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useCurrency } from "@/hooks/useCurrency";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";

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

  const [type, setType] =
    useState<"income" | "expense">("expense");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [paymentMethod, setPaymentMethod] = useState("");
  const [needWant, setNeedWant] = useState("");
  const [notes, setNotes] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          .select("id, name, type")
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
      new Date().toISOString().split("T")[0]
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2E8]">
        <p className="text-[#7B9685]">
          Loading your transactions...
        </p>
      </main>
    );
  }

  const transactionToDelete = transactions.find(
    (transaction) => transaction.id === deletingId
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

          {/* HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7B9685]">
                Ordiva Transactions
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Transactions
              </h1>

              <p className="mt-3 text-lg text-[#5F7168]">
                Track your income and expenses.
              </p>
            </div>
          </div>

          {/* MAIN CONTENT */}

          <div className="mt-10 grid gap-6 lg:grid-cols-[420px_1fr]">

            {/* ADD / EDIT */}

            <section
              id="transaction-form"
              className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingId
                        ? "Edit transaction"
                        : "Add transaction"}
                    </h2>

                    <p className="mt-1 text-sm text-[#7B9685]">
                      {editingId
                        ? "Update your transaction details."
                        : "Record your latest financial activity."}
                    </p>
                  </div>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm font-semibold text-[#7B9685] transition hover:text-[#214F43]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* TYPE */}

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Transaction type
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setType("expense");
                        markFormDirty();
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        type === "expense"
                          ? "border-[#214F43] bg-[#E8EEDB]"
                          : "border-[#DDE6D7] bg-[#F9F8F2] hover:bg-[#E8EEDB]"
                      }`}
                    >
                      Expense
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setType("income");
                        markFormDirty();
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        type === "income"
                          ? "border-[#214F43] bg-[#E8EEDB]"
                          : "border-[#DDE6D7] bg-[#F9F8F2] hover:bg-[#E8EEDB]"
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                {/* CATEGORY */}

                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Category
                  </label>

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      markFormDirty();
                    }}
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  >
                    <option value="">
                      Select category
                    </option>

                    {filteredCategories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* AMOUNT */}

                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Amount ({currency})
                  </label>

                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      markFormDirty();
                    }}
                    placeholder={
                      currency === "IDR"
                        ? "50000"
                        : "50"
                    }
                    required
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />

                  <p className="mt-2 text-xs text-[#7B9685]">
                    Amounts are stored securely in
                    IDR and converted automatically.
                  </p>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold"
                  >
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
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                {/* DATE */}

                <div>
                  <label
                    htmlFor="transactionDate"
                    className="mb-2 block text-sm font-semibold"
                  >
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
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                {/* PAYMENT */}

                <div>
                  <label
                    htmlFor="paymentMethod"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Payment method
                  </label>

                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      markFormDirty();
                    }}
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  >
                    <option value="">
                      Select payment method
                    </option>

                    <option value="cash">
                      Cash
                    </option>

                    <option value="bank_transfer">
                      Bank transfer
                    </option>

                    <option value="debit_card">
                      Debit card
                    </option>

                    <option value="credit_card">
                      Credit card
                    </option>

                    <option value="e_wallet">
                      E-wallet
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                {/* NEED / WANT */}

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Need or want?
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNeedWant("need");
                        markFormDirty();
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        needWant === "need"
                          ? "border-[#214F43] bg-[#E8EEDB]"
                          : "border-[#DDE6D7] bg-[#F9F8F2] hover:bg-[#E8EEDB]"
                      }`}
                    >
                      Need
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNeedWant("want");
                        markFormDirty();
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        needWant === "want"
                          ? "border-[#214F43] bg-[#E8EEDB]"
                          : "border-[#DDE6D7] bg-[#F9F8F2] hover:bg-[#E8EEDB]"
                      }`}
                    >
                      Want
                    </button>
                  </div>
                </div>

                {/* NOTES */}

                <div>
                  <label
                    htmlFor="notes"
                    className="mb-2 block text-sm font-semibold"
                  >
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
                    className="w-full resize-none rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                {message && (
                  <div className="rounded-2xl bg-[#E8EEDB] px-4 py-3 text-sm text-[#214F43]">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (currency !== "IDR" &&
                      (!Number.isFinite(rate) ||
                        rate <= 0))
                  }
                  className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
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

            {/* RECENT TRANSACTIONS */}

            <section className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Recent transactions
                  </h2>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Your latest financial activity.
                  </p>
                </div>

                <span className="rounded-full bg-[#E8EEDB] px-3 py-1 text-xs font-semibold text-[#214F43]">
                  {transactions.length} total
                </span>
              </div>

              {transactions.length === 0 ? (
                /* =================================================
                   EMPTY STATE
                ================================================== */

                <div className="flex min-h-[430px] items-center justify-center rounded-2xl bg-[#F9F8F2] px-6 py-10">
                  <div className="max-w-sm text-center">

                    {/* Icon */}

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[#E8EEDB] text-2xl text-[#214F43] shadow-sm">
                      ↗
                    </div>

                    <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7B9685]">
                      Your financial space is ready
                    </p>

                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                      Start with your first transaction.
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#5F7168]">
                      Record an income or expense to
                      start understanding where your
                      money goes.
                    </p>

                    <button
                      type="button"
                      onClick={scrollToTransactionForm}
                      className="mt-7 rounded-full bg-[#214F43] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(33,79,67,0.14)] transition hover:-translate-y-0.5 hover:bg-[#173C34]"
                    >
                      Add your first transaction
                      <span className="ml-2">
                        →
                      </span>
                    </button>

                    <div className="mx-auto mt-7 max-w-xs border-t border-[#DDE6D7] pt-5">
                      <p className="text-[11px] leading-5 text-[#8B9A92]">
                        Your transactions will help power
                        your budgets, spending insights,
                        goals, and reports.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map(
                    (transaction) => {
                      const category =
                        categories.find(
                          (item) =>
                            item.id ===
                            transaction.category_id
                        );

                      return (
                        <div
                          key={transaction.id}
                          className="rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold">
                                {
                                  transaction.description
                                }
                              </p>

                              <p className="mt-1 text-xs text-[#7B9685]">
                                {category?.name ||
                                  "Uncategorized"}
                                {" · "}
                                {
                                  transaction.transaction_date
                                }

                                {transaction.payment_method
                                  ? ` · ${transaction.payment_method.replace(
                                      "_",
                                      " "
                                    )}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <p className="text-lg font-bold text-[#173C34]">
                                {transaction.type ===
                                "income"
                                  ? "+"
                                  : "-"}{" "}
                                {formatCurrency(
                                  Number(
                                    transaction.amount
                                  )
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2 border-t border-[#DDE6D7] pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  transaction
                                )
                              }
                              className="rounded-xl border border-[#DDE6D7] px-4 py-2 text-xs font-semibold text-[#214F43] transition hover:bg-[#E8EEDB]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal(
                                  transaction.id
                                )
                              }
                              className="rounded-xl border border-[#E8D7D7] px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-[#FDECEC]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

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