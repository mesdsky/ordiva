"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import { useCurrency } from "@/hooks/useCurrency";
import {
  PremiumBadge,
  PremiumLock,
  PremiumModal,
} from "@/components/Premium";
import { isPremium as checkPremium } from "@/lib/premium";

type TransactionType = "income" | "expense";
type Plan = "free" | "premium";

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
  type: TransactionType;
};

type DailyData = {
  day: string;
  income: number;
  expense: number;
};

type MonthlyData = {
  month: string;
  label: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
};

export default function ReportsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historicalTransactions, setHistoricalTransactions] =
    useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plan, setPlan] = useState<Plan>("free");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [errorMessage, setErrorMessage] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const {
    currency,
    rate,
    format: formatCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const isPremium = checkPremium(plan);

  async function loadReportData(month: string) {
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

    // ---------------------------------------------
    // LOAD USER PLAN
    // ---------------------------------------------
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    const currentPlan: Plan =
      profileData?.plan === "premium" ? "premium" : "free";

    setPlan(currentPlan);

    // ---------------------------------------------
    // DATE RANGE
    // ---------------------------------------------
    const startDate = `${month}-01`;
    const nextMonth = addMonths(month, 1);
    const nextMonthStart = `${nextMonth}-01`;

    // Premium gets 12 months of data.
    // Free only loads the selected month.
    const historicalStartMonth = addMonths(month, -11);
    const historicalStartDate = `${historicalStartMonth}-01`;

    const transactionStartDate = currentPlan === "premium"
      ? historicalStartDate
      : startDate;

    // ---------------------------------------------
    // LOAD TRANSACTIONS
    // ---------------------------------------------
    const {
      data: transactionData,
      error: transactionError,
    } = await supabase
      .from("transactions")
      .select(
        "id, type, amount, description, transaction_date, category_id"
      )
      .eq("user_id", user.id)
      .gte("transaction_date", transactionStartDate)
      .lt("transaction_date", nextMonthStart)
      .order("transaction_date", {
        ascending: true,
      });

    if (transactionError) {
      setErrorMessage(transactionError.message);
      setLoading(false);
      return;
    }

    // ---------------------------------------------
    // LOAD CATEGORIES
    // ---------------------------------------------
    const {
      data: categoryData,
      error: categoryError,
    } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id);

    if (categoryError) {
      setErrorMessage(categoryError.message);
      setLoading(false);
      return;
    }

    const loadedTransactions: Transaction[] = (
      transactionData ?? []
    ).map((transaction) => ({
      id: String(transaction.id),
      type:
        transaction.type === "income"
          ? "income"
          : "expense",
      amount: Number(transaction.amount),
      description: transaction.description
        ? String(transaction.description)
        : null,
      transaction_date: String(
        transaction.transaction_date
      ),
      category_id: transaction.category_id
        ? String(transaction.category_id)
        : null,
    }));

    const loadedCategories: Category[] = (
      categoryData ?? []
    ).map((category) => ({
      id: String(category.id),
      name: String(category.name),
      type:
        category.type === "income"
          ? "income"
          : "expense",
    }));

    setCategories(loadedCategories);

    if (currentPlan === "premium") {
      setHistoricalTransactions(loadedTransactions);

      setTransactions(
        loadedTransactions.filter(
          (transaction) =>
            transaction.transaction_date >= startDate &&
            transaction.transaction_date < nextMonthStart
        )
      );
    } else {
      setHistoricalTransactions([]);
      setTransactions(loadedTransactions);
    }

    setLoading(false);
  }

  useEffect(() => {
    // Async data loading intentionally updates UI state after the external request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReportData(selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();

    categories.forEach((category) => {
      map.set(category.id, category.name);
    });

    return map;
  }, [categories]);

  // =====================================================
  // CURRENT MONTH METRICS
  // =====================================================

  const totalIncome = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }, [transactions]);

  const savings = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0
      ? (savings / totalIncome) * 100
      : 0;

  // =====================================================
  // DAILY CASH FLOW
  // =====================================================

  const dailyData = useMemo(() => {
    const [year, monthNumber] =
      selectedMonth.split("-").map(Number);

    const daysInMonth = new Date(
      year,
      monthNumber,
      0
    ).getDate();

    const data: DailyData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedMonth}-${String(
        day
      ).padStart(2, "0")}`;

      const dayTransactions =
        transactions.filter(
          (transaction) =>
            transaction.transaction_date ===
            dateString
        );

      const income = dayTransactions
        .filter(
          (transaction) =>
            transaction.type === "income"
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      const expense = dayTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense"
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      data.push({
        day: String(day),
        income,
        expense,
      });
    }

    return data;
  }, [transactions, selectedMonth]);

  // =====================================================
  // CATEGORY SPENDING
  // =====================================================

  const categorySpending = useMemo(() => {
    const categoryTotals = new Map<string, number>();

    transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .forEach((transaction) => {
        const categoryName =
          transaction.category_id
            ? categoryMap.get(
                transaction.category_id
              ) ?? "Uncategorized"
            : "Uncategorized";

        const current =
          categoryTotals.get(categoryName) ?? 0;

        categoryTotals.set(
          categoryName,
          current + transaction.amount
        );
      });

    return Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalExpense > 0
            ? (amount / totalExpense) * 100
            : 0,
      }))
      .sort(
        (a, b) => b.amount - a.amount
      );
  }, [
    transactions,
    categoryMap,
    totalExpense,
  ]);

  const freeTopSpending =
    categorySpending.slice(0, 3);

  const premiumTopSpending =
    categorySpending.slice(0, 5);

  // =====================================================
  // 12 MONTH TREND — PREMIUM
  // =====================================================

  const monthlyTrend = useMemo(() => {
    if (!isPremium) return [];

    const months: MonthlyData[] = [];

    for (let i = 11; i >= 0; i--) {
      const month = addMonths(selectedMonth, -i);

      const monthTransactions =
        historicalTransactions.filter(
          (transaction) =>
            transaction.transaction_date.startsWith(
              month
            )
        );

      const income = monthTransactions
        .filter(
          (transaction) =>
            transaction.type === "income"
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      const expense = monthTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense"
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0
        );

      const monthSavings = income - expense;

      months.push({
        month,
        label: formatShortMonth(month),
        income,
        expense,
        savings: monthSavings,
        savingsRate:
          income > 0
            ? (monthSavings / income) * 100
            : 0,
      });
    }

    return months;
  }, [
    isPremium,
    historicalTransactions,
    selectedMonth,
  ]);

  // =====================================================
  // MONTHLY COMPARISON — PREMIUM
  // =====================================================

  const previousMonth = addMonths(
    selectedMonth,
    -1
  );

  const previousMonthStats = useMemo(() => {
    if (!isPremium) {
      return {
        income: 0,
        expense: 0,
        savings: 0,
      };
    }

    const previousTransactions =
      historicalTransactions.filter(
        (transaction) =>
          transaction.transaction_date.startsWith(
            previousMonth
          )
      );

    const income = previousTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    const expense = previousTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );

    return {
      income,
      expense,
      savings: income - expense,
    };
  }, [
    isPremium,
    historicalTransactions,
    previousMonth,
  ]);

  // =====================================================
  // FINANCIAL HEALTH SCORE — PREMIUM
  // =====================================================

  const financialHealthScore = useMemo(() => {
    if (!isPremium) return 0;

    let score = 0;

    // Savings discipline: 40 points
    if (savingsRate >= 30) {
      score += 40;
    } else if (savingsRate >= 20) {
      score += 32;
    } else if (savingsRate >= 10) {
      score += 24;
    } else if (savingsRate >= 0) {
      score += 15;
    }

    // Expense control: 30 points
    if (totalIncome > 0) {
      const expenseRatio =
        totalExpense / totalIncome;

      if (expenseRatio <= 0.5) {
        score += 30;
      } else if (expenseRatio <= 0.7) {
        score += 24;
      } else if (expenseRatio <= 0.85) {
        score += 18;
      } else if (expenseRatio <= 1) {
        score += 10;
      }
    }

    // Positive cash flow: 20 points
    if (savings > 0) {
      score += 20;
    } else if (savings === 0) {
      score += 10;
    }

    // Activity consistency: 10 points
    if (transactions.length >= 20) {
      score += 10;
    } else if (transactions.length >= 10) {
      score += 7;
    } else if (transactions.length >= 5) {
      score += 5;
    }

    return Math.min(score, 100);
  }, [
    isPremium,
    savingsRate,
    totalIncome,
    totalExpense,
    savings,
    transactions.length,
  ]);

  // =====================================================
  // SPENDING PATTERN — PREMIUM
  // =====================================================

  const spendingPattern = useMemo(() => {
    if (!isPremium || categorySpending.length === 0) {
      return null;
    }

    const largestCategory =
      categorySpending[0];

    const concentration =
      largestCategory.percentage;

    let label = "Balanced";

    if (concentration >= 50) {
      label = "Highly concentrated";
    } else if (concentration >= 35) {
      label = "Category-heavy";
    } else if (concentration >= 25) {
      label = "Moderately concentrated";
    }

    return {
      label,
      largestCategory:
        largestCategory.name,
      percentage: concentration,
    };
  }, [
    isPremium,
    categorySpending,
  ]);

  // =====================================================
  // ADVANCED INSIGHT — PREMIUM
  // =====================================================

  const advancedInsight = useMemo(() => {
    if (!isPremium) return "";

    if (transactions.length === 0) {
      return "There is not enough activity yet to identify a meaningful spending pattern.";
    }

    if (savings < 0) {
      return "Your expenses exceeded your income this month. Focus on the largest spending categories first to regain positive cash flow.";
    }

    if (savingsRate >= 30) {
      return "You are keeping a strong share of your income. Maintaining this level consistently can create meaningful room for future goals.";
    }

    if (savingsRate >= 20) {
      return "Your savings rate is healthy. The next opportunity is improving consistency and protecting the amount you save each month.";
    }

    if (savingsRate >= 10) {
      return "You are saving, but there is still room to increase your savings rate by reviewing discretionary spending.";
    }

    return "Your savings rate is relatively low. Start by identifying one or two categories where spending can be reduced without affecting essential needs.";
  }, [
    isPremium,
    transactions.length,
    savings,
    savingsRate,
  ]);

  // =====================================================
  // MONTH LABEL
  // =====================================================

  const monthLabel = useMemo(() => {
    const [year, month] =
      selectedMonth.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      1
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[180px] bg-[linear-gradient(180deg,#DDE8D8_0%,#F0F1E8_42%,#F5F2E8_100%)]"
      />

      <Navigation />

      <main className="relative z-10 min-h-screen overflow-x-hidden bg-[#F5F2E8] text-[#173C34]">
        {/* =====================================================
            REPORT HERO
        ===================================================== */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('/ordiva-hero-bg.jpg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#102F29]/95 via-[#173C34]/82 to-[#173C34]/48" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173C34]/70 via-transparent to-[#173C34]/10" />

          <div className="pointer-events-none absolute -left-28 top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-[#AFC1A4]/15 to-transparent" />
          <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-gradient-to-bl from-white/10 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 md:px-12 lg:px-16">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                  <span className="h-2 w-2 rounded-full bg-[#C8D8BE] shadow-[0_0_14px_rgba(200,216,190,0.8)]" />
                  Financial intelligence
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
                    Your money,
                    <br />
                    <span className="text-[#C8D8BE]">
                      decoded.
                    </span>
                  </h1>

                  {isPremium && (
                    <div className="mb-2">
                      <PremiumBadge className="border-[#C8D8BE]/30 bg-[#C8D8BE]/10 text-[#C8D8BE]" />
                    </div>
                  )}
                </div>

                <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                  A clear monthly view of your income,
                  spending, savings, and the habits behind
                  your numbers.
                </p>
              </div>

              {/* PERIOD SELECTOR */}
              <div className="w-full max-w-sm lg:w-80">
                <div className="rounded-[2rem] border border-white/35 bg-white/12 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-md">
                  <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-6">
                    <label
                      htmlFor="report-month"
                      className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50"
                    >
                      Report period
                    </label>

                    <input
                      id="report-month"
                      type="month"
                      value={selectedMonth}
                      onChange={(event) =>
                        setSelectedMonth(
                          event.target.value
                        )
                      }
                      className="mt-3 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-white/40 focus:border-white/40 focus:bg-white/15"
                    />

                    <p className="mt-4 text-xs leading-5 text-white/45">
                      Reviewing your financial activity for{" "}
                      <span className="font-semibold text-[#C8D8BE]">
                        {monthLabel}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING SUMMARY */}
            {!loading && !currencyLoading && (
              <div className="relative z-20 mt-10 grid gap-3 sm:grid-cols-3">
                <MemoReportHeroStat
                  label="Income"
                  value={formatCurrency(totalIncome)}
                  icon="↗"
                />

                <MemoReportHeroStat
                  label="Expenses"
                  value={formatCurrency(totalExpense)}
                  icon="↘"
                />

                <MemoReportHeroStat
                  label="Savings"
                  value={formatCurrency(savings)}
                  icon="◇"
                  highlight
                />
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            REPORT CONTENT
        ===================================================== */}
        <section className="relative -mt-10 rounded-t-[2.75rem] bg-[linear-gradient(180deg,#F5F2E8_0%,#F8F6EF_48%,#F5F2E8_100%)] px-6 pb-20 pt-14 md:px-12 lg:px-16">
          <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-[#AFC1A4]/15 to-transparent" />

          <div className="relative mx-auto max-w-7xl">
            {errorMessage && (
              <div className="mb-8 rounded-2xl border border-red-100 bg-[#FDECEC] px-4 py-3 text-sm text-red-700 shadow-sm">
                {errorMessage}
              </div>
            )}

            {loading || currencyLoading ? (
              <div className="flex min-h-72 items-center justify-center border-y border-[#DDE6D7]">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-[#214F43]" />
                  <p className="text-sm font-medium text-[#7B9685]">
                    Preparing your report...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* SECTION HEADER */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7B9685]">
                      Monthly overview
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
                      The bigger picture.
                    </h2>
                  </div>

                  <p className="max-w-md text-sm leading-6 text-[#7B9685] sm:text-right">
                    {transactions.length === 0
                      ? `No activity recorded for ${monthLabel}.`
                      : `A visual breakdown of your financial activity in ${monthLabel}.`}
                  </p>
                </div>

                {/* =================================================
                    KEY METRICS
                ================================================= */}
                <div className="grid gap-0 border-y border-[#DDE6D7] md:grid-cols-3 md:divide-x md:divide-[#DDE6D7]">
                  <MemoReportMetric
                    label="Net savings"
                    value={formatCurrency(savings)}
                    description={
                      savings >= 0
                        ? "Income left after expenses"
                        : "Expenses exceeded income"
                    }
                    danger={savings < 0}
                  />

                  <MemoReportMetric
                    label="Savings rate"
                    value={`${savingsRate.toFixed(1)}%`}
                    description="Share of income kept"
                  />

                  <MemoReportMetric
                    label="Transactions"
                    value={String(
                      transactions.length
                    )}
                    description={`Recorded in ${monthLabel}`}
                  />
                </div>

                {/* =================================================
                    CASH FLOW
                ================================================= */}
                <section className="mt-10">
                  <MemoReportSectionHeader
                    eyebrow="Cash flow"
                    title="Income vs expenses."
                    description={`Daily movement throughout ${monthLabel}.`}
                  />

                  <div className="mt-5 rounded-[2rem] border border-[#DDE6D7] bg-white/60 p-5 shadow-[0_20px_55px_rgba(23,60,52,0.06)] md:p-7">
                    {transactions.length === 0 ? (
                      <EmptyState text="No transactions recorded for this month." />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-4 border-b border-[#DDE6D7] pb-5">
                          <MemoChartLegend
                            color="bg-[#214F43]"
                            label="Income"
                          />
                          <MemoChartLegend
                            color="bg-[#AFC1A4]"
                            label="Expense"
                          />
                          <span className="ml-auto text-xs text-[#7B9685]">
                            {transactions.length} transaction
                            {transactions.length === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>

                        <div className="mt-6 h-[360px] w-full">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                            debounce={120}
                          >
                            <BarChart
                              data={dailyData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#DDE6D7"
                              />

                              <XAxis
                                dataKey="day"
                                tick={{
                                  fontSize: 10,
                                  fill: "#7B9685",
                                }}
                                axisLine={false}
                                tickLine={false}
                                interval={
                                  daysInMonthForChart(
                                    selectedMonth
                                  ) > 20
                                    ? 2
                                    : 0
                                }
                              />

                              <YAxis
                                tick={{
                                  fontSize: 10,
                                  fill: "#7B9685",
                                }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) =>
                                  formatCompactCurrency(
                                    Number(value),
                                    currency,
                                    rate
                                  )
                                }
                              />

                              <Tooltip
                                formatter={(value, name) => [
                                  formatCurrency(
                                    Number(value)
                                  ),
                                  name === "income"
                                    ? "Income"
                                    : "Expense",
                                ]}
                                labelFormatter={(label) =>
                                  `Day ${label}`
                                }
                                contentStyle={{
                                  borderRadius: "18px",
                                  border: "1px solid #DDE6D7",
                                  backgroundColor:
                                    "rgba(249,248,242,0.96)",
                                  boxShadow:
                                    "0 15px 40px rgba(23,60,52,0.12)",
                                }}
                                labelStyle={{
                                  color: "#173C34",
                                  fontWeight: 600,
                                  marginBottom: "5px",
                                }}
                              />

                              <Bar
                                dataKey="income"
                                fill="#214F43"
                                radius={[
                                  7,
                                  7,
                                  0,
                                  0,
                                ]}
                                maxBarSize={20}
                              />

                              <Bar
                                dataKey="expense"
                                fill="#AFC1A4"
                                radius={[
                                  7,
                                  7,
                                  0,
                                  0,
                                ]}
                                maxBarSize={20}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* =================================================
                    SPENDING + SAVINGS
                ================================================= */}
                <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
                  {/* SPENDING */}
                  <section>
                    <MemoReportSectionHeader
                      eyebrow="Spending"
                      title="Where it went."
                      description={
                        isPremium
                          ? "Your largest expense categories for the month."
                          : "Your top spending categories for the month."
                      }
                    />

                    <div className="mt-5 rounded-[2rem] border border-[#DDE6D7] bg-white/60 p-5 shadow-[0_20px_55px_rgba(23,60,52,0.06)] md:p-7">
                      {categorySpending.length === 0 ? (
                        <EmptyState text="No expense data available for this month." />
                      ) : (
                        <div className="space-y-6">
                          {(isPremium
                            ? premiumTopSpending
                            : freeTopSpending
                          ).map(
                            (category, index) => (
                              <div
                                key={category.name}
                              >
                                <div className="mb-2 flex items-end justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EEDB] text-xs font-bold text-[#214F43]">
                                      {index + 1}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold">
                                        {category.name}
                                      </p>
                                      <p className="mt-1 text-[10px] text-[#7B9685]">
                                        {category.percentage.toFixed(
                                          1
                                        )}
                                        % of total
                                      </p>
                                    </div>
                                  </div>

                                  <p className="shrink-0 text-sm font-bold">
                                    {formatCurrency(
                                      category.amount
                                    )}
                                  </p>
                                </div>

                                <div className="ml-12 h-2 overflow-hidden rounded-full bg-[#DDE6D7]">
                                  <div
                                    className="h-full rounded-full bg-[#7B9685] transition-all duration-700"
                                    style={{
                                      width: `${Math.min(
                                        Math.max(
                                          category.percentage,
                                          2
                                        ),
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          )}

                          {!isPremium &&
                            categorySpending.length >
                              3 && (
                              <PremiumTeaser
                                title="See your full spending breakdown"
                                description="Unlock complete category analysis with Ordiva Premium."
                                onClick={() =>
                                  setUpgradeOpen(true)
                                }
                              />
                            )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SAVINGS */}
                  <section>
                    <MemoReportSectionHeader
                      eyebrow="Savings"
                      title="What you kept."
                      description="A simple view of your saving discipline."
                    />

                    <div className="relative mt-5 min-h-[330px] overflow-hidden rounded-[2rem] border border-white/20 bg-[#214F43] p-7 text-white shadow-[0_20px_50px_rgba(33,79,67,0.12)]">
                      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-bl from-white/10 to-transparent" />
                      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-gradient-to-tr from-[#AFC1A4]/10 to-transparent" />

                      <div className="relative">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
                          Savings rate
                        </p>

                        <div className="mt-5 flex items-end justify-between gap-4">
                          <p className="text-5xl font-bold tracking-tight text-white">
                            {savingsRate.toFixed(1)}%
                          </p>

                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-[#C8D8BE]">
                            {savings >= 0
                              ? "On track"
                              : "Needs attention"}
                          </span>
                        </div>

                        <div className="mt-7 h-3 overflow-hidden rounded-full bg-[#173C34]">
                          <div
                            className="h-full rounded-full bg-[#C8D8BE] transition-all duration-700"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  savingsRate,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex justify-between text-[10px] text-white/40">
                          <span>0%</span>
                          <span>100%</span>
                        </div>

                        <div className="mt-8 border-t border-white/10 pt-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                                Saved
                              </p>
                              <p className="mt-1 text-lg font-bold text-[#C8D8BE]">
                                {formatCurrency(
                                  savings
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                                Income
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {formatCurrency(
                                  totalIncome
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* =================================================
                    PREMIUM 12-MONTH TREND
                ================================================= */}
                <section className="mt-12">
                  <MemoReportSectionHeader
                    eyebrow="Premium intelligence"
                    title="See the bigger trend."
                    description="Track how your income, expenses, and savings have evolved over the last 12 months."
                  />

                  <div className="mt-5">
                    {!isPremium ? (
                      <PremiumLock
                        title="12-month financial trends"
                        description="Understand where your money is heading over time with long-term income, expense, and savings trends."
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    ) : (
                      <div className="rounded-[2rem] border border-[#DDE6D7] bg-white/60 p-5 shadow-[0_20px_55px_rgba(23,60,52,0.06)] md:p-7">
                        <div className="flex flex-wrap items-center gap-4 border-b border-[#DDE6D7] pb-5">
                          <MemoChartLegend
                            color="bg-[#214F43]"
                            label="Income"
                          />
                          <MemoChartLegend
                            color="bg-[#AFC1A4]"
                            label="Expenses"
                          />
                          <MemoChartLegend
                            color="bg-[#7B9685]"
                            label="Savings"
                          />
                        </div>

                        <div className="mt-6 h-[360px] w-full">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                            debounce={120}
                          >
                            <LineChart
                              data={monthlyTrend}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#DDE6D7"
                              />

                              <XAxis
                                dataKey="label"
                                tick={{
                                  fontSize: 10,
                                  fill: "#7B9685",
                                }}
                                axisLine={false}
                                tickLine={false}
                              />

                              <YAxis
                                tick={{
                                  fontSize: 10,
                                  fill: "#7B9685",
                                }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) =>
                                  formatCompactCurrency(
                                    Number(value),
                                    currency,
                                    rate
                                  )
                                }
                              />

                              <Tooltip
                                formatter={(value, name) => [
                                  formatCurrency(
                                    Number(value)
                                  ),
                                  name === "income"
                                    ? "Income"
                                    : name === "expense"
                                    ? "Expenses"
                                    : "Savings",
                                ]}
                                contentStyle={{
                                  borderRadius: "18px",
                                  border: "1px solid #DDE6D7",
                                  backgroundColor:
                                    "rgba(249,248,242,0.96)",
                                  boxShadow:
                                    "0 15px 40px rgba(23,60,52,0.12)",
                                }}
                              />

                              <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#214F43"
                                strokeWidth={2.5}
                                dot={false}
                              />

                              <Line
                                type="monotone"
                                dataKey="expense"
                                stroke="#AFC1A4"
                                strokeWidth={2.5}
                                dot={false}
                              />

                              <Line
                                type="monotone"
                                dataKey="savings"
                                stroke="#7B9685"
                                strokeWidth={2.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    MONTHLY COMPARISON
                ================================================= */}
                <section className="mt-12">
                  <MemoReportSectionHeader
                    eyebrow="Premium intelligence"
                    title="Better than last month?"
                    description={`Compare ${monthLabel} with ${formatMonthLabel(previousMonth)}.`}
                  />

                  <div className="mt-5">
                    {!isPremium ? (
                      <PremiumLock
                        title="Monthly comparison"
                        description="See exactly how your income, expenses, and savings changed compared with the previous month."
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    ) : (
                      <div className="grid gap-0 rounded-[2rem] border border-[#DDE6D7] bg-white/60 shadow-[0_20px_55px_rgba(23,60,52,0.06)] md:grid-cols-3 md:divide-x md:divide-[#DDE6D7]">
                        <MemoComparisonMetric
                          label="Income"
                          current={totalIncome}
                          previous={
                            previousMonthStats.income
                          }
                          formatCurrency={
                            formatCurrency
                          }
                        />

                        <MemoComparisonMetric
                          label="Expenses"
                          current={totalExpense}
                          previous={
                            previousMonthStats.expense
                          }
                          formatCurrency={
                            formatCurrency
                          }
                          inverse
                        />

                        <MemoComparisonMetric
                          label="Savings"
                          current={savings}
                          previous={
                            previousMonthStats.savings
                          }
                          formatCurrency={
                            formatCurrency
                          }
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    TOP SPENDING + QUICK INSIGHT
                ================================================= */}
                <div className="mt-12 grid gap-10 lg:grid-cols-2">
                  <section>
                    <MemoReportSectionHeader
                      eyebrow="Top categories"
                      title="Your biggest spends."
                      description={
                        isPremium
                          ? "The categories taking the largest share of your money."
                          : "Your top three spending categories."
                      }
                    />

                    <div className="mt-5 border-y border-[#DDE6D7]">
                      {freeTopSpending.length === 0 ? (
                        <EmptyState text="No spending data yet." />
                      ) : (
                        <div>
                          {freeTopSpending.map(
                            (category, index) => (
                              <div
                                key={category.name}
                                className="group flex items-center gap-4 border-b border-[#DDE6D7] py-5 transition hover:bg-white/40"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E8EEDB] text-sm font-bold text-[#214F43]">
                                  {index + 1}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    {category.name}
                                  </p>

                                  <p className="mt-1 text-xs text-[#7B9685]">
                                    {category.percentage.toFixed(
                                      1
                                    )}
                                    % of total expenses
                                  </p>
                                </div>

                                <p className="text-sm font-bold">
                                  {formatCurrency(
                                    category.amount
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <MemoReportSectionHeader
                      eyebrow="Quick read"
                      title="What the numbers say."
                      description="A simple interpretation of this month's activity."
                    />

                    <div className="mt-5 rounded-[2rem] border border-[#DDE6D7] bg-white/55 p-7 shadow-[0_20px_55px_rgba(23,60,52,0.05)]">
                      <div className="space-y-6">
                        <MemoInsightRow
                          label="Income"
                          value={formatCurrency(
                            totalIncome
                          )}
                          description={
                            totalIncome > 0
                              ? "Money flowing into your accounts."
                              : "No income was recorded this month."
                          }
                        />

                        <MemoInsightRow
                          label="Expenses"
                          value={formatCurrency(
                            totalExpense
                          )}
                          description={
                            totalExpense > 0
                              ? "Money spent across your categories."
                              : "No expenses were recorded this month."
                          }
                        />

                        <MemoInsightRow
                          label="Net"
                          value={formatCurrency(
                            savings
                          )}
                          description={
                            savings >= 0
                              ? "You finished the month with money left over."
                              : "Your spending was higher than your income."
                          }
                          danger={savings < 0}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/transactions"
                          )
                        }
                        className="group mt-7 flex w-full items-center justify-between rounded-2xl border border-[#DDE6D7] bg-white/60 px-5 py-4 text-sm font-semibold text-[#214F43] transition hover:-translate-y-0.5 hover:bg-white"
                      >
                        Review transactions
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </button>
                    </div>
                  </section>
                </div>

                {/* =================================================
                    PREMIUM ANALYTICS
                ================================================= */}
                <section className="mt-12">
                  <MemoReportSectionHeader
                    eyebrow="Premium intelligence"
                    title="Know what is really happening."
                    description="Deeper signals behind your monthly numbers."
                  />

                  <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    {/* HEALTH SCORE */}
                    {!isPremium ? (
                      <PremiumLock
                        title="Financial health score"
                        description="Get a 0–100 score based on savings, cash flow, spending control, and consistency."
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    ) : (
                      <div className="relative overflow-hidden rounded-[2rem] border border-[#DDE6D7] bg-[#214F43] p-7 text-white shadow-[0_20px_50px_rgba(33,79,67,0.10)]">
                        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-[#AFC1A4]/15 to-transparent" />

                        <div className="relative">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
                            Financial health
                          </p>

                          <div className="mt-5 flex items-end gap-2">
                            <span className="text-6xl font-bold tracking-tight text-[#C8D8BE]">
                              {financialHealthScore}
                            </span>
                            <span className="mb-2 text-sm text-white/40">
                              / 100
                            </span>
                          </div>

                          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#173C34]">
                            <div
                              className="h-full rounded-full bg-[#C8D8BE] transition-all duration-700"
                              style={{
                                width: `${financialHealthScore}%`,
                              }}
                            />
                          </div>

                          <p className="mt-5 text-sm leading-6 text-white/60">
                            {getHealthLabel(
                              financialHealthScore
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SPENDING PATTERN */}
                    {!isPremium ? (
                      <PremiumLock
                        title="Spending patterns"
                        description="Discover whether your spending is balanced or concentrated in a few categories."
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    ) : (
                      <div className="rounded-[2rem] border border-[#DDE6D7] bg-white/60 p-7 shadow-[0_20px_55px_rgba(23,60,52,0.06)]">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                          Spending pattern
                        </p>

                        <h4 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                          {spendingPattern?.label ??
                            "Balanced"}
                        </h4>

                        <p className="mt-3 text-sm leading-6 text-[#7B9685]">
                          {spendingPattern
                            ? `${spendingPattern.largestCategory} accounts for ${spendingPattern.percentage.toFixed(
                                1
                              )}% of your expenses.`
                            : "Not enough expense data to identify a pattern."}
                        </p>

                        {spendingPattern && (
                          <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#DDE6D7]">
                            <div
                              className="h-full rounded-full bg-[#7B9685]"
                              style={{
                                width: `${Math.min(
                                  spendingPattern.percentage,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADVANCED INSIGHT */}
                    {!isPremium ? (
                      <PremiumLock
                        title="Advanced insights"
                        description="Get deeper recommendations based on your actual spending and savings behavior."
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    ) : (
                      <div className="rounded-[2rem] border border-[#DDE6D7] bg-white/60 p-7 shadow-[0_20px_55px_rgba(23,60,52,0.06)]">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                          Advanced insight
                        </p>

                        <h4 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                          What to do next.
                        </h4>

                        <p className="mt-4 text-sm leading-6 text-[#5F7168]">
                          {advancedInsight}
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    FULL CATEGORY ANALYSIS — PREMIUM
                ================================================= */}
                <section className="mt-12">
                  <MemoReportSectionHeader
                    eyebrow="Premium intelligence"
                    title="Full category analysis."
                    description="See the complete distribution of your spending instead of only the top categories."
                  />

                  <div className="mt-5">
                    {!isPremium ? (
                      <PremiumLock
                        title="Unlock full category analysis"
                        description="Go beyond your top three categories and see your complete spending distribution."
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    ) : (
                      <div className="rounded-[2rem] border border-[#DDE6D7] bg-white/60 p-5 shadow-[0_20px_55px_rgba(23,60,52,0.06)] md:p-7">
                        {categorySpending.length === 0 ? (
                          <EmptyState text="No category data available for this month." />
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {categorySpending.map(
                              (category) => (
                                <div
                                  key={
                                    category.name
                                  }
                                  className="rounded-2xl border border-[#DDE6D7] bg-white/45 p-5"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <p className="truncate text-sm font-semibold">
                                      {category.name}
                                    </p>

                                    <p className="shrink-0 text-sm font-bold text-[#214F43]">
                                      {formatCurrency(
                                        category.amount
                                      )}
                                    </p>
                                  </div>

                                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#DDE6D7]">
                                    <div
                                      className="h-full rounded-full bg-[#7B9685]"
                                      style={{
                                        width: `${Math.min(
                                          Math.max(
                                            category.percentage,
                                            2
                                          ),
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <p className="mt-2 text-[10px] text-[#7B9685]">
                                    {category.percentage.toFixed(
                                      1
                                    )}
                                    % of total expenses
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    EMPTY OVERALL STATE
                ================================================= */}
                {transactions.length === 0 && (
                  <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/20 bg-[#214F43] p-8 text-white shadow-[0_20px_50px_rgba(33,79,67,0.12)] md:p-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#214F43] via-[#214F43] to-[#173C34]" />
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-[#AFC1A4]/15 to-transparent" />

                    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8D8BE]">
                          Start your story
                        </p>

                        <h3 className="mt-2 text-2xl font-semibold md:text-3xl">
                          Give your numbers something to say.
                        </h3>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                          Add transactions and come back here to see
                          your financial patterns take shape.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/transactions"
                          )
                        }
                        className="group shrink-0 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:-translate-y-1 hover:bg-white/20"
                      >
                        + Add Transaction
                        <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* FOOTER */}
                <div className="mt-12 flex flex-col gap-3 border-t border-[#DDE6D7] pt-6 text-xs text-[#7B9685] sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Ordiva · Plan Smarter. Live Brighter.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/dashboard")
                    }
                    className="w-fit transition hover:text-[#214F43]"
                  >
                    Back to Dashboard →
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* =========================================================
          PREMIUM UPGRADE MODAL
      ========================================================= */}
      <PremiumModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  );
}

/* =============================================================
   HERO STAT
============================================================= */

function ReportHeroStat({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_20px_50px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.4)] transition duration-300 hover:-translate-y-1 ${
        highlight
          ? "border-[#C8D8BE]/30 bg-[#AFC1A4]/15"
          : "border-white/20 bg-white/10"
      }`}
    >
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">
            {label}
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
            highlight
              ? "border-[#C8D8BE]/30 bg-[#C8D8BE]/10 text-[#C8D8BE]"
              : "border-white/15 bg-white/10 text-white"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   METRIC
============================================================= */

function ReportMetric({
  label,
  value,
  description,
  danger = false,
}: {
  label: string;
  value: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="px-0 py-5 md:px-7 md:py-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7B9685]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${
          danger
            ? "text-red-700"
            : "text-[#173C34]"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-[#7B9685]">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   SECTION HEADER
============================================================= */

function ReportSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7B9685]">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-[#7B9685]">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   CHART LEGEND
============================================================= */

function ChartLegend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#5F7168]">
      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />
      {label}
    </div>
  );
}

/* =============================================================
   INSIGHT ROW
============================================================= */

function InsightRow({
  label,
  value,
  description,
  danger = false,
}: {
  label: string;
  value: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="border-b border-[#DDE6D7] pb-5 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">
          {label}
        </p>

        <p
          className={`text-sm font-bold ${
            danger
              ? "text-red-700"
              : "text-[#214F43]"
          }`}
        >
          {value}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#7B9685]">
        {description}
      </p>
    </div>
  );
}

/* =============================================================
   COMPARISON METRIC
============================================================= */

function ComparisonMetric({
  label,
  current,
  previous,
  formatCurrency,
  inverse = false,
}: {
  label: string;
  current: number;
  previous: number;
  formatCurrency: (value: number) => string;
  inverse?: boolean;
}) {
  const change =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : ((current - previous) /
          Math.abs(previous)) *
        100;

  const positive =
    inverse ? change <= 0 : change >= 0;

  return (
    <div className="px-5 py-6 md:px-7">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7B9685]">
        {label}
      </p>

      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-xl font-bold tracking-tight text-[#173C34]">
          {formatCurrency(current)}
        </p>

        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
            positive
              ? "bg-[#E8EEDB] text-[#214F43]"
              : "bg-[#FDECEC] text-red-700"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>

      <p className="mt-2 text-xs text-[#7B9685]">
        Previous: {formatCurrency(previous)}
      </p>
    </div>
  );
}

const MemoReportHeroStat = memo(ReportHeroStat);
const MemoReportMetric = memo(ReportMetric);
const MemoReportSectionHeader = memo(ReportSectionHeader);
const MemoChartLegend = memo(ChartLegend);
const MemoInsightRow = memo(InsightRow);
const MemoComparisonMetric = memo(ComparisonMetric);

/* =============================================================
   PREMIUM LOCKED CARD
============================================================= */

/* =============================================================
   PREMIUM TEASER
============================================================= */

function PremiumTeaser({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2]/80 p-4 text-left transition hover:bg-white"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#214F43] text-xs text-[#C8D8BE]">
          ✦
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#214F43]">
              {title}
            </p>

            <span className="rounded-full bg-[#E8EEDB] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#214F43]">
              Premium
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-[#7B9685]">
            {description}
          </p>
        </div>
      </div>

      <span className="shrink-0 text-[#214F43] transition-transform group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}

/* =============================================================
   UPGRADE MODAL
============================================================= */

/* =============================================================
   EMPTY STATE
============================================================= */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-32 items-center justify-center border-y border-dashed border-[#DDE6D7] px-6 py-8 text-center">
      <p className="text-sm text-[#7B9685]">
        {text}
      </p>
    </div>
  );
}

/* =============================================================
   DATE HELPERS
============================================================= */

function addMonths(
  month: string,
  amount: number
) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  const date = new Date(
    year,
    monthNumber - 1 + amount,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatShortMonth(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  return new Date(
    year,
    monthNumber - 1,
    1
  ).toLocaleDateString("en-US", {
    month: "short",
  });
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  return new Date(
    year,
    monthNumber - 1,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function daysInMonthForChart(month: string) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  return new Date(
    year,
    monthNumber,
    0
  ).getDate();
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

/* =============================================================
   HEALTH SCORE
============================================================= */

function getHealthLabel(score: number) {
  if (score >= 85) {
    return "Excellent financial momentum. Your current habits show strong control and saving discipline.";
  }

  if (score >= 70) {
    return "Healthy financial position. A little more consistency could make your progress even stronger.";
  }

  if (score >= 50) {
    return "There is a solid foundation, but some spending or saving habits could be improved.";
  }

  return "Your numbers suggest there is room to improve cash flow and spending control.";
}

/* =============================================================
   CURRENCY
============================================================= */

function formatCompactCurrency(
  amount: number,
  currency: string,
  rate: number
) {
  const convertedAmount =
    currency === "IDR"
      ? amount
      : amount * rate;

  if (convertedAmount >= 1_000_000_000) {
    return `${(
      convertedAmount / 1_000_000_000
    ).toFixed(1)}B`;
  }

  if (convertedAmount >= 1_000_000) {
    return `${(
      convertedAmount / 1_000_000
    ).toFixed(1)}M`;
  }

  if (convertedAmount >= 1_000) {
    return `${(
      convertedAmount / 1_000
    ).toFixed(0)}K`;
  }

  return String(
    Math.round(convertedAmount)
  );
}