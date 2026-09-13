"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import { useCurrency } from "@/hooks/useCurrency";

type RecentTransaction = {
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
};

type CategorySpending = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
};

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

type Budget = {
  id: string;
  category_id: string;
  amount: number;
};

type BudgetSummary = {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
};

type BudgetInsight = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  description: string | null;
};

type GoalSummary = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  targetDate: string | null;
  description: string | null;
};

type Subscription = {
  id: string;
  name: string;
  amount: number;
  billing_cycle: "weekly" | "monthly" | "yearly";
  next_payment_date: string;
  category: string | null;
  active: boolean;
};

type SubscriptionSummary = {
  activeCount: number;
  monthlyCost: number;
  yearlyCost: number;
  nextPayment: Subscription | null;
};

type Debt = {
  id: string;
  name: string;
  type: "debt" | "receivable";
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  description: string | null;
};

type DebtSummary = {
  totalDebt: number;
  totalReceivable: number;
  outstandingCount: number;
  nextDue: Debt | null;
};

type UpcomingMoneyItem = {
  id: string;
  kind: "subscription" | "debt" | "receivable" | "goal";
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  route: string;
};

type ActionItem = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  route: string;
  actionLabel: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [name, setName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [visible, setVisible] = useState(false);

  const {
    format: formatCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);

  const [previousMonthIncome, setPreviousMonthIncome] = useState(0);
  const [previousMonthExpenses, setPreviousMonthExpenses] = useState(0);

  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<
    CategorySpending[]
  >([]);

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    percentage: 0,
  });

  const [budgetInsights, setBudgetInsights] = useState<BudgetInsight[]>([]);

  const [goalSummary, setGoalSummary] =
    useState<GoalSummary | null>(null);

  const [subscriptionSummary, setSubscriptionSummary] =
    useState<SubscriptionSummary>({
      activeCount: 0,
      monthlyCost: 0,
      yearlyCost: 0,
      nextPayment: null,
    });

  const [debtSummary, setDebtSummary] = useState<DebtSummary>({
    totalDebt: 0,
    totalReceivable: 0,
    outstandingCount: 0,
    nextDue: null,
  });

  const [upcomingMoney, setUpcomingMoney] = useState<
    UpcomingMoneyItem[]
  >([]);

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function formatPaymentMethod(method: string | null) {
    if (!method) return "";

    return method
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  }

  function formatGoalDate(date: string | null) {
    if (!date) return "No target date";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatSubscriptionDate(date: string | null) {
    if (!date) return "No payment date";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDebtDate(date: string | null) {
    if (!date) return "No due date";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getDaysUntil(date: string) {
    const today = new Date();
    const target = new Date(`${date}T00:00:00`);

    if (Number.isNaN(target.getTime())) return null;

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const targetStart = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate()
    );

    return Math.round(
      (targetStart.getTime() - todayStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  function formatUpcomingTiming(date: string) {
    const days = getDaysUntil(date);

    if (days === null) return "";

    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `In ${days} days`;

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  }

  function formatBillingCycle(
    cycle: Subscription["billing_cycle"]
  ) {
    if (cycle === "weekly") return "Weekly";
    if (cycle === "monthly") return "Monthly";
    return "Yearly";
  }

  function getPercentageChange(
    current: number,
    previous: number
  ) {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }

    return ((current - previous) / previous) * 100;
  }

  function createMonthlyData(
    transactions: {
      type: string;
      amount: number;
      transaction_date: string;
    }[]
  ): MonthlyData[] {
    const today = new Date();

    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNumber = String(month + 1).padStart(2, "0");
      const key = `${year}-${monthNumber}`;

      const label = date.toLocaleDateString("en-US", {
        month: "short",
      });

      months.push({ key, label });
    }

    return months.map(({ key, label }) => {
      let monthIncome = 0;
      let monthExpenses = 0;

      for (const transaction of transactions) {
        if (transaction.transaction_date.slice(0, 7) !== key) {
          continue;
        }

        const amount = Number(transaction.amount);

        if (transaction.type === "income") {
          monthIncome += amount;
        }

        if (transaction.type === "expense") {
          monthExpenses += amount;
        }
      }

      return {
        month: label,
        income: monthIncome,
        expenses: monthExpenses,
      };
    });
  }

  useEffect(() => {
    const animationTimer = setTimeout(() => setVisible(true), 80);

    async function loadDashboard() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const today = new Date();

      const currentYear = today.getFullYear();

      const currentMonth = String(
        today.getMonth() + 1
      ).padStart(2, "0");

      const currentMonthStart =
        `${currentYear}-${currentMonth}-01`;

      const previousMonthDate = new Date(
        currentYear,
        today.getMonth() - 1,
        1
      );

      const previousMonthYear =
        previousMonthDate.getFullYear();

      const previousMonth =
        String(previousMonthDate.getMonth() + 1).padStart(
          2,
          "0"
        );

      const previousMonthKey =
        `${previousMonthYear}-${previousMonth}`;

      const nextMonthDate = new Date(
        currentYear,
        today.getMonth() + 1,
        1
      );

      const nextMonthYear = nextMonthDate.getFullYear();

      const nextMonth = String(
        nextMonthDate.getMonth() + 1
      ).padStart(2, "0");

      const nextMonthStart =
        `${nextMonthYear}-${nextMonth}-01`;

      const [
        profileResult,
        transactionsResult,
        recentTransactionsResult,
        categoriesResult,
        budgetsResult,
        monthlyTransactionsResult,
        goalsResult,
        subscriptionsResult,
        debtsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),

        supabase
          .from("transactions")
          .select(
            "id, type, amount, category_id, transaction_date"
          )
          .eq("user_id", user.id),

        supabase
          .from("transactions")
          .select(
            "id, type, amount, description, transaction_date, payment_method, need_want, notes, category_id"
          )
          .eq("user_id", user.id)
          .order("transaction_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("categories")
          .select("id, name")
          .eq("user_id", user.id),

        supabase
          .from("budgets")
          .select("id, category_id, amount")
          .eq("user_id", user.id)
          .eq("month", currentMonthStart),

        supabase
          .from("transactions")
          .select(
            "type, amount, category_id, transaction_date"
          )
          .eq("user_id", user.id)
          .gte("transaction_date", currentMonthStart)
          .lt("transaction_date", nextMonthStart),

        supabase
          .from("goals")
          .select(
            "id, name, target_amount, current_amount, target_date, description"
          )
          .eq("user_id", user.id)
          .order("target_date", {
            ascending: true,
            nullsFirst: false,
          }),

        supabase
          .from("subscriptions")
          .select(
            "id, name, amount, billing_cycle, next_payment_date, category, active"
          )
          .eq("user_id", user.id)
          .eq("active", true)
          .order("next_payment_date", {
            ascending: true,
          }),

        supabase
          .from("debts")
          .select(
            "id, name, type, total_amount, remaining_amount, due_date, description"
          )
          .eq("user_id", user.id)
          .gt("remaining_amount", 0)
          .order("due_date", {
            ascending: true,
            nullsFirst: false,
          }),
      ]);

      if (profileResult.data?.full_name) {
        setName(profileResult.data.full_name);
      }

      const loadedCategories: Category[] = (
        categoriesResult.data ?? []
      ).map((category) => ({
        id: String(category.id),
        name: String(category.name),
      }));

      setCategories(loadedCategories);

      const upcomingItems: UpcomingMoneyItem[] = [];

      if (!transactionsResult.error) {
        const transactions = transactionsResult.data ?? [];

        let currentMonthIncome = 0;
        let currentMonthExpenses = 0;
        let lastMonthIncome = 0;
        let lastMonthExpenses = 0;

        for (const transaction of transactions) {
          const amount = Number(transaction.amount);
          const transactionMonth =
            String(transaction.transaction_date).slice(0, 7);

          if (transactionMonth ===
              currentMonthStart.slice(0, 7)) {
            if (transaction.type === "income") {
              currentMonthIncome += amount;
            }

            if (transaction.type === "expense") {
              currentMonthExpenses += amount;
            }
          }

          if (transactionMonth === previousMonthKey) {
            if (transaction.type === "income") {
              lastMonthIncome += amount;
            }

            if (transaction.type === "expense") {
              lastMonthExpenses += amount;
            }
          }
        }

        const totalBalance =
          currentMonthIncome - currentMonthExpenses;

        const calculatedSavingsRate =
          currentMonthIncome > 0
            ? ((currentMonthIncome - currentMonthExpenses) /
                currentMonthIncome) *
              100
            : 0;

        setIncome(currentMonthIncome);
        setExpenses(currentMonthExpenses);
        setBalance(totalBalance);
        setSavingsRate(calculatedSavingsRate);
        setPreviousMonthIncome(lastMonthIncome);
        setPreviousMonthExpenses(lastMonthExpenses);

        const spendingMap: Record<string, number> = {};

        for (const transaction of transactions) {
          if (
            transaction.type !== "expense" ||
            !transaction.category_id ||
            String(transaction.transaction_date).slice(0, 7) !==
              currentMonthStart.slice(0, 7)
          ) {
            continue;
          }

          const categoryId = String(
            transaction.category_id
          );

          const amount = Number(transaction.amount);

          spendingMap[categoryId] =
            (spendingMap[categoryId] ?? 0) + amount;
        }

        const spendingData: CategorySpending[] =
          Object.entries(spendingMap)
            .map(([categoryId, amount]) => {
              const category = loadedCategories.find(
                (item) => item.id === categoryId
              );

              return {
                id: categoryId,
                name: category?.name ?? "Uncategorized",
                amount,
                percentage:
                  currentMonthExpenses > 0
                    ? (amount / currentMonthExpenses) * 100
                    : 0,
              };
            })
            .sort((a, b) => b.amount - a.amount);

        setCategorySpending(spendingData);

        setMonthlyData(
          createMonthlyData(
            transactions.map((transaction) => ({
              type: String(transaction.type),
              amount: Number(transaction.amount),
              transaction_date: String(
                transaction.transaction_date
              ),
            }))
          )
        );
      }

      if (
        !budgetsResult.error &&
        !monthlyTransactionsResult.error
      ) {
        const budgets: Budget[] = (
          budgetsResult.data ?? []
        ).map((budget) => ({
          id: String(budget.id),
          category_id: String(budget.category_id),
          amount: Number(budget.amount),
        }));

        const monthlyTransactions =
          monthlyTransactionsResult.data ?? [];

        const totalBudget = budgets.reduce(
          (total, budget) => total + budget.amount,
          0
        );

        let totalSpent = 0;

        const insights: BudgetInsight[] = budgets.map((budget) => {
          const categorySpent = monthlyTransactions
            .filter(
              (transaction) =>
                transaction.type === "expense" &&
                transaction.category_id &&
                String(transaction.category_id) === budget.category_id
            )
            .reduce((total, transaction) => total + Number(transaction.amount), 0);

          totalSpent += categorySpent;

          return {
            id: budget.id,
            name:
              loadedCategories.find(
                (category) => category.id === budget.category_id
              )?.name ?? "Uncategorized",
            budget: budget.amount,
            spent: categorySpent,
            remaining: budget.amount - categorySpent,
            percentage: budget.amount > 0 ? (categorySpent / budget.amount) * 100 : 0,
          };
        });

        insights.sort((a, b) => b.percentage - a.percentage);

        const remaining = totalBudget - totalSpent;
        const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        setBudgetSummary({ totalBudget, totalSpent, remaining, percentage });
        setBudgetInsights(insights);
      }

      if (!goalsResult.error) {
        const goals: Goal[] = (
          goalsResult.data ?? []
        ).map((goal) => ({
          id: String(goal.id),
          name: String(goal.name),
          target_amount: Number(goal.target_amount),
          current_amount: Number(goal.current_amount),
          target_date: goal.target_date
            ? String(goal.target_date)
            : null,
          description: goal.description
            ? String(goal.description)
            : null,
        }));

        const activeGoal =
          goals.find(
            (goal) =>
              goal.current_amount < goal.target_amount
          ) ?? goals[0];

        if (activeGoal) {
          const targetAmount = activeGoal.target_amount;
          const currentAmount = activeGoal.current_amount;

          const remaining = Math.max(
            targetAmount - currentAmount,
            0
          );

          const percentage =
            targetAmount > 0
              ? Math.min(
                  (currentAmount / targetAmount) * 100,
                  100
                )
              : 0;

          setGoalSummary({
            id: activeGoal.id,
            name: activeGoal.name,
            targetAmount,
            currentAmount,
            remaining,
            percentage,
            targetDate: activeGoal.target_date,
            description: activeGoal.description,
          });
        } else {
          setGoalSummary(null);
        }

        for (const goal of goals) {
          if (
            !goal.target_date ||
            goal.current_amount >= goal.target_amount
          ) {
            continue;
          }

          upcomingItems.push({
            id: `goal-${goal.id}`,
            kind: "goal",
            title: goal.name,
            subtitle: "Goal deadline",
            date: goal.target_date,
            amount: Math.max(
              goal.target_amount - goal.current_amount,
              0
            ),
            route: "/goals",
          });
        }
      }

      if (!subscriptionsResult.error) {
        const subscriptions: Subscription[] = (
          subscriptionsResult.data ?? []
        ).map((subscription) => ({
          id: String(subscription.id),
          name: String(subscription.name),
          amount: Number(subscription.amount),
          billing_cycle:
            subscription.billing_cycle as Subscription[
              "billing_cycle"
            ],
          next_payment_date: String(
            subscription.next_payment_date
          ),
          category: subscription.category
            ? String(subscription.category)
            : null,
          active: Boolean(subscription.active),
        }));

        let monthlyCost = 0;
        let yearlyCost = 0;

        for (const subscription of subscriptions) {
          const amount = Number(subscription.amount);

          if (subscription.billing_cycle === "weekly") {
            monthlyCost += (amount * 52) / 12;
            yearlyCost += amount * 52;
          }

          if (subscription.billing_cycle === "monthly") {
            monthlyCost += amount;
            yearlyCost += amount * 12;
          }

          if (subscription.billing_cycle === "yearly") {
            monthlyCost += amount / 12;
            yearlyCost += amount;
          }
        }

        setSubscriptionSummary({
          activeCount: subscriptions.length,
          monthlyCost,
          yearlyCost,
          nextPayment: subscriptions[0] ?? null,
        });

        for (const subscription of subscriptions) {
          upcomingItems.push({
            id: `subscription-${subscription.id}`,
            kind: "subscription",
            title: subscription.name,
            subtitle: `${formatBillingCycle(
              subscription.billing_cycle
            )} subscription`,
            date: subscription.next_payment_date,
            amount: subscription.amount,
            route: "/subscriptions",
          });
        }
      }

      if (!debtsResult.error) {
        const debts: Debt[] = (
          debtsResult.data ?? []
        ).map((debt) => ({
          id: String(debt.id),
          name: String(debt.name),
          type:
            debt.type === "receivable"
              ? "receivable"
              : "debt",
          total_amount: Number(debt.total_amount),
          remaining_amount: Number(
            debt.remaining_amount
          ),
          due_date: debt.due_date
            ? String(debt.due_date)
            : null,
          description: debt.description
            ? String(debt.description)
            : null,
        }));

        const totalDebt = debts
          .filter((debt) => debt.type === "debt")
          .reduce(
            (total, debt) =>
              total + debt.remaining_amount,
            0
          );

        const totalReceivable = debts
          .filter((debt) => debt.type === "receivable")
          .reduce(
            (total, debt) =>
              total + debt.remaining_amount,
            0
          );

        setDebtSummary({
          totalDebt,
          totalReceivable,
          outstandingCount: debts.length,
          nextDue: debts[0] ?? null,
        });

        for (const debt of debts) {
          if (!debt.due_date) continue;

          upcomingItems.push({
            id: `${debt.type}-${debt.id}`,
            kind:
              debt.type === "receivable"
                ? "receivable"
                : "debt",
            title: debt.name,
            subtitle:
              debt.type === "receivable"
                ? "Receivable due"
                : "Debt due",
            date: debt.due_date,
            amount: debt.remaining_amount,
            route: "/debts",
          });
        }
      }

      if (!recentTransactionsResult.error) {
        const recentData: RecentTransaction[] = (
          recentTransactionsResult.data ?? []
        ).map((transaction) => ({
          id: String(transaction.id),
          type:
            transaction.type === "income"
              ? "income"
              : "expense",
          amount: Number(transaction.amount),
          description: String(transaction.description),
          transaction_date: String(
            transaction.transaction_date
          ),
          payment_method: transaction.payment_method
            ? String(transaction.payment_method)
            : null,
          need_want: transaction.need_want
            ? String(transaction.need_want)
            : null,
          notes: transaction.notes
            ? String(transaction.notes)
            : null,
          category_id: transaction.category_id
            ? String(transaction.category_id)
            : null,
        }));

        setRecentTransactions(recentData);
      }

      upcomingItems.sort((a, b) => {
        return a.date.localeCompare(b.date);
      });

      setUpcomingMoney(upcomingItems.slice(0, 6));

      setLoading(false);
    }

    loadDashboard();

    return () => {
      clearTimeout(animationTimer);
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  if (loading || currencyLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F2E8]">
        <div className="absolute h-64 w-64 rounded-full bg-[#AFC1A4]/15 blur-3xl" />

        <div className="relative rounded-[1.75rem] border border-white/70 bg-white/60 px-8 py-6 shadow-[0_20px_50px_rgba(23,60,52,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-[#214F43]" />

            <p className="text-sm font-medium text-[#5F7168]">
              Preparing your dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const hasBudget = budgetSummary.totalBudget > 0;

  const incomeChange = getPercentageChange(
    income,
    previousMonthIncome
  );

  const expenseChange = getPercentageChange(
    expenses,
    previousMonthExpenses
  );

  const currentSavings = income - expenses;

  const previousSavings =
    previousMonthIncome - previousMonthExpenses;

  const savingsChange = getPercentageChange(
    currentSavings,
    previousSavings
  );

  const budgetProgress = Math.min(
    budgetSummary.percentage,
    100
  );

  const highestBudgetRisk = budgetInsights[0] ?? null;
  const overBudgetCount = budgetInsights.filter((budget) => budget.percentage > 100).length;
  const nearLimitCount = budgetInsights.filter((budget) => budget.percentage >= 80 && budget.percentage <= 100).length;

  const hasGoal = goalSummary !== null;
  const goalProgress = goalSummary?.percentage ?? 0;

  const goalDaysRemaining = (() => {
    if (!goalSummary?.targetDate) return null;

    const today = new Date();
    const targetDate = new Date(`${goalSummary.targetDate}T00:00:00`);

    if (Number.isNaN(targetDate.getTime())) return null;

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const difference =
      targetDate.getTime() - todayStart.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  })();

  const goalMonthsRemaining =
    goalDaysRemaining !== null && goalDaysRemaining > 0
      ? Math.max(Math.ceil(goalDaysRemaining / 30), 1)
      : null;

  const goalMonthlyPace =
    goalSummary && goalMonthsRemaining
      ? goalSummary.remaining / goalMonthsRemaining
      : null;

  const goalInsight =
    !goalSummary
      ? null
      : goalSummary.remaining <= 0
      ? "Goal reached. Nice work — you can celebrate this milestone."
      : goalDaysRemaining === null
      ? "Set a target date to see the monthly pace needed to reach this goal."
      : goalDaysRemaining < 0
      ? "This goal is past its target date. Consider updating the timeline or adding to it soon."
      : goalDaysRemaining <= 30
      ? "This goal is due soon. Keep the next few contributions focused."
      : `Aim for about ${goalMonthlyPace ? formatCurrency(Math.round(goalMonthlyPace)) : "—"} per month to reach your target.`;

  const hasSubscriptions =
    subscriptionSummary.activeCount > 0;

  const hasDebts = debtSummary.outstandingCount > 0;

  const actionItems: ActionItem[] = [];

  if (overBudgetCount > 0 && highestBudgetRisk) {
    actionItems.push({
      id: "budget-over",
      priority: "high",
      title: `${overBudgetCount} budget${overBudgetCount > 1 ? "s" : ""} over the limit`,
      description: `${highestBudgetRisk.name} is at ${highestBudgetRisk.percentage.toFixed(0)}%. Review the category before adding more spending.`,
      route: "/budget",
      actionLabel: "Review budget",
    });
  } else if (nearLimitCount > 0 && highestBudgetRisk) {
    actionItems.push({
      id: "budget-near",
      priority: "medium",
      title: `${nearLimitCount} budget${nearLimitCount > 1 ? "s are" : " is"} near the limit`,
      description: `${highestBudgetRisk.name} is currently at ${highestBudgetRisk.percentage.toFixed(0)}% of its budget.`,
      route: "/budget",
      actionLabel: "Check budget",
    });
  }

  if (currentSavings < 0) {
    actionItems.push({
      id: "negative-cash-flow",
      priority: "high",
      title: "Expenses are above income",
      description: `You are ${formatCurrency(Math.abs(currentSavings))} below break-even this month. Review your recent spending.`,
      route: "/transactions",
      actionLabel: "Review spending",
    });
  } else if (income > 0 && savingsRate < 10) {
    actionItems.push({
      id: "low-savings",
      priority: "medium",
      title: "Savings rate is low",
      description: `You are currently saving ${savingsRate.toFixed(1)}% of this month's income. Consider setting aside a little more.`,
      route: "/goals",
      actionLabel: "View goals",
    });
  }

  const urgentUpcoming = upcomingMoney.find((item) => {
    const days = getDaysUntil(item.date);
    return days !== null && days >= 0 && days <= 7;
  });

  if (urgentUpcoming) {
    actionItems.push({
      id: "upcoming",
      priority: urgentUpcoming.kind === "receivable" ? "low" : "medium",
      title: urgentUpcoming.kind === "receivable"
        ? `${urgentUpcoming.title} is due soon`
        : `${urgentUpcoming.title} is coming up`,
      description: `${urgentUpcoming.subtitle}. ${formatCurrency(urgentUpcoming.amount)} is scheduled for ${formatUpcomingTiming(urgentUpcoming.date).toLowerCase()}.`,
      route: urgentUpcoming.route,
      actionLabel: "View details",
    });
  }

  if (goalSummary && goalSummary.targetDate) {
    const goalDays = getDaysUntil(goalSummary.targetDate);

    if (
      goalDays !== null &&
      goalDays >= 0 &&
      goalDays <= 30 &&
      goalSummary.percentage < 80
    ) {
      actionItems.push({
        id: "goal-deadline",
        priority: "medium",
        title: `${goalSummary.name} needs attention`,
        description: `The target is ${goalSummary.percentage.toFixed(0)}% complete with ${formatCurrency(goalSummary.remaining)} still needed.`,
        route: "/goals",
        actionLabel: "Review goal",
      });
    }
  }

  if (actionItems.length === 0) {
    if (categorySpending.length > 0) {
      actionItems.push({
        id: "spending-check",
        priority: "low",
        title: "Your finances look on track",
        description: "Keep the momentum going by reviewing your spending and staying consistent with your plan.",
        route: "/reports",
        actionLabel: "View insights",
      });
    } else {
      actionItems.push({
        id: "first-step",
        priority: "low",
        title: "Start with a transaction",
        description: "Add your first transaction so Ordiva can turn your activity into useful financial guidance.",
        route: "/transactions",
        actionLabel: "Add transaction",
      });
    }
  }

  const visibleActions = actionItems.slice(0, 3);

  const topSpendingCategory = categorySpending[0] ?? null;
  const spendingCategoryCount = categorySpending.length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F2E8] text-[#173C34]">
      <Navigation />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/ordiva-hero-bg.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#102F29]/95 via-[#173C34]/80 to-[#173C34]/45" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#173C34]/65 via-transparent to-[#173C34]/10" />

        {/* Static decorative layers only — no continuous animation */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-[#AFC1A4]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-white/8 blur-3xl" />

        <div
          className={`relative mx-auto max-w-7xl px-6 pb-28 pt-20 md:px-12 lg:px-16 ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          } transition-[opacity,transform] duration-700`}
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75 backdrop-blur-lg">
                <span className="h-2 w-2 rounded-full bg-[#C8D8BE]" />
                Your financial overview
              </div>

              <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
                {getGreeting()},
                <br />
                <span className="text-[#C8D8BE]">
                  {name}.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                Here&apos;s a clear picture of your
                money, your progress, and what deserves
                your attention today.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/transactions")
                  }
                  className="group relative overflow-hidden rounded-full border border-white/30 bg-[#214F43]/90 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#173C34]"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    + Add Transaction
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/reports")}
                  className="rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/20"
                >
                  View Reports
                </button>
              </div>
            </div>

            {/* BALANCE */}
            <div className="w-full max-w-sm lg:w-80">
              <div className="rounded-[2rem] border border-white/30 bg-white/10 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">
                        Total balance
                      </p>

                      <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                        {formatCurrency(balance)}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
                      ↗
                    </div>
                  </div>

                  <div className="mt-7 h-px bg-white/15" />

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-white/50">
                        Savings rate
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#C8D8BE]">
                        {savingsRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] text-white/50">
                        Net this month
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatCurrency(income - expenses)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO STATS */}
          <div className="relative z-20 mt-10 grid gap-3 sm:grid-cols-3">
            <HeroStat
              label="Income"
              value={formatCurrency(income)}
              icon="↗"
              comparison={incomeChange}
              comparisonLabel="vs last month"
            />

            <HeroStat
              label="Expenses"
              value={formatCurrency(expenses)}
              icon="↘"
              comparison={expenseChange}
              comparisonLabel="vs last month"
              inverseComparison
            />

            <HeroStat
              label="Savings"
              value={formatCurrency(
                Math.max(currentSavings, 0)
              )}
              icon="◇"
              highlight
              comparison={savingsChange}
              comparisonLabel="vs last month"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="relative -mt-10 rounded-t-[2.75rem] bg-[linear-gradient(180deg,#F5F2E8_0%,#F8F6EF_48%,#F5F2E8_100%)] px-6 pb-20 pt-14 md:px-12 lg:px-16">
        <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-[#AFC1A4]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7B9685]">
                Your finances
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
                Your financial picture.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-[#7B9685] sm:text-right">
              Everything important, organized in one
              calm and simple overview.
            </p>
          </div>

          {/* CASH FLOW + GOAL */}
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
            <GlassPanel className="p-5 md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Cash flow
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Income vs expenses
                  </h3>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Last 6 months
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-full border border-[#DDE6D7] bg-white/55 px-4 py-2">
                  <ChartLegend
                    color="bg-[#214F43]"
                    label="Income"
                  />

                  <ChartLegend
                    color="bg-[#9A6256]"
                    label="Expenses"
                  />
                </div>
              </div>

              <div className="mt-8 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -15,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#DDE6D7"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: "#7B9685",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#7B9685",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        value >= 1000000
                          ? `${(
                              value / 1000000
                            ).toFixed(1)}M`
                          : value >= 1000
                          ? `${(
                              value / 1000
                            ).toFixed(0)}K`
                          : `${value}`
                      }
                    />

                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        String(name),
                      ]}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #DDE6D7",
                        backgroundColor:
                          "rgba(249,248,242,0.97)",
                        boxShadow:
                          "0 12px 30px rgba(23,60,52,0.10)",
                      }}
                      labelStyle={{
                        color: "#173C34",
                        fontWeight: 600,
                        marginBottom: "5px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#214F43"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: "#214F43",
                        strokeWidth: 0,
                      }}
                      activeDot={{ r: 5 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#9A6256"
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: "#9A6256",
                        strokeWidth: 0,
                      }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            {/* GOAL */}
            <GlassPanel
              className="overflow-hidden p-0"
              green
            >
              <div className="relative h-full min-h-[360px] p-6 md:p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/8 blur-3xl" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                        Financial goal
                      </p>

                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {hasGoal
                          ? goalSummary?.name
                          : "Start saving"}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/goals")}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
                    >
                      →
                    </button>
                  </div>

                  {hasGoal ? (
                    <>
                      <div className="relative mx-auto mt-8 flex h-44 w-44 items-center justify-center">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(#C8D8BE 0 ${goalProgress}%, rgba(255,255,255,0.12) ${goalProgress}% 100%)`,
                          }}
                        />

                        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#214F43]">
                          <span className="text-4xl font-bold text-white">
                            {goalProgress.toFixed(0)}%
                          </span>

                          <span className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/45">
                            completed
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">
                              Goal intelligence
                            </p>

                            <p className="mt-2 text-xs leading-5 text-white/60">
                              {goalInsight}
                            </p>
                          </div>

                          {goalSummary?.targetDate && (
                            <div className="shrink-0 text-right">
                              <p className="text-[9px] text-white/40">
                                Target
                              </p>

                              <p className="mt-1 text-xs font-semibold text-white">
                                {formatGoalDate(goalSummary.targetDate)}
                              </p>
                            </div>
                          )}
                        </div>

                        {goalMonthlyPace !== null && goalSummary.remaining > 0 && (
                          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                            <p className="text-[9px] text-white/40">
                              Suggested monthly pace
                            </p>

                            <p className="text-sm font-bold text-[#C8D8BE]">
                              {formatCurrency(Math.round(goalMonthlyPace))}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-[9px] text-white/45">
                            Saved
                          </p>

                          <p className="mt-1 text-sm font-bold text-white">
                            {formatCurrency(
                              goalSummary?.currentAmount ?? 0
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-[9px] text-white/45">
                            Remaining
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#C8D8BE]">
                            {formatCurrency(
                              goalSummary?.remaining ?? 0
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="my-auto">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl text-white">
                        ◎
                      </div>

                      <p className="mt-6 text-sm leading-6 text-white/60">
                        Create your first financial goal
                        and start turning intentions into
                        progress.
                      </p>

                      <button
                        type="button"
                        onClick={() => router.push("/goals")}
                        className="mt-6 rounded-full bg-[#F5F2E8] px-5 py-3 text-sm font-semibold text-[#214F43] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
                      >
                        Create Goal →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* BUDGET */}
          <div className="mt-6">
            <GlassPanel className="p-5 md:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Monthly budget
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Stay within your limits.
                  </h3>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Track this month&apos;s spending against
                    your budget.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/budget")}
                  className="group flex w-fit items-center gap-2 rounded-full border border-[#DDE6D7] bg-white/60 px-4 py-2.5 text-xs font-semibold text-[#214F43] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
                >
                  Manage Budget
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>

              {!hasBudget ? (
                <EmptyState
                  icon="▣"
                  title="No budget set yet"
                  description="Create a monthly budget to start tracking your spending."
                  buttonLabel="Create Budget"
                  onClick={() => router.push("/budget")}
                />
              ) : (
                <>
                  <div className="mt-7 grid gap-0 border-y border-[#DDE6D7] md:grid-cols-3 md:divide-x md:divide-[#DDE6D7]">
                    <MetricCard
                      label="Total Budget"
                      value={formatCurrency(
                        budgetSummary.totalBudget
                      )}
                    />

                    <MetricCard
                      label="Spent"
                      value={formatCurrency(
                        budgetSummary.totalSpent
                      )}
                    />

                    <MetricCard
                      label="Remaining"
                      value={formatCurrency(
                        budgetSummary.remaining
                      )}
                      danger={
                        budgetSummary.remaining < 0
                      }
                    />
                  </div>

                  <div className="mt-7">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Budget usage
                      </p>

                      <p className="text-sm font-bold text-[#7B9685]">
                        {budgetSummary.percentage.toFixed(1)}%
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-[#DDE6D7]">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          budgetSummary.percentage > 100
                            ? "bg-red-500"
                            : "bg-[#214F43]"
                        }`}
                        style={{
                          width: `${budgetProgress}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-[#7B9685]">
                      <span>
                        {formatCurrency(
                          budgetSummary.totalSpent
                        )}{" "}
                        spent
                      </span>

                      <span>
                        {formatCurrency(
                          Math.max(
                            budgetSummary.remaining,
                            0
                          )
                        )}{" "}
                        left
                      </span>
                    </div>


                    {highestBudgetRisk && (
                      <div className="mt-6 rounded-[1.5rem] border border-[#DDE6D7] bg-[#F9F8F2]/80 p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">Budget intelligence</p>
                        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm leading-6 text-[#5F7168]">
                            {overBudgetCount > 0 ? `${overBudgetCount} budget${overBudgetCount > 1 ? "s are" : " is"} already over the limit.` : nearLimitCount > 0 ? `${nearLimitCount} budget${nearLimitCount > 1 ? "s are" : " is"} getting close to the limit.` : "Your budgets are currently on track."}
                          </p>
                          <div className="rounded-2xl bg-white/80 px-4 py-3 sm:min-w-[190px]">
                            <p className="text-xs text-[#7B9685]">Most watched</p>
                            <div className="mt-1 flex items-center justify-between gap-4">
                              <p className="max-w-[130px] truncate text-sm font-semibold text-[#214F43]">{highestBudgetRisk.name}</p>
                              <p className={`text-sm font-bold ${highestBudgetRisk.percentage > 100 ? "text-[#7A4D43]" : "text-[#214F43]"}`}>{highestBudgetRisk.percentage.toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {budgetInsights.length > 1 && (
                      <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold">Category watchlist</p>
                          <p className="text-xs text-[#7B9685]">Highest usage first</p>
                        </div>
                        <div className="space-y-3">
                          {budgetInsights.slice(0, 3).map((budget) => (
                            <div key={budget.id} className="rounded-2xl border border-[#DDE6D7] bg-white/50 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#214F43]">{budget.name}</p>
                                  <p className="mt-1 text-xs text-[#7B9685]">{formatCurrency(budget.spent)} of {formatCurrency(budget.budget)}</p>
                                </div>
                                <p className={`shrink-0 text-sm font-bold ${budget.percentage > 100 ? "text-[#7A4D43]" : "text-[#214F43]"}`}>{budget.percentage.toFixed(0)}%</p>
                              </div>
                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DDE6D7]">
                                <div className={`h-full rounded-full ${budget.percentage > 100 ? "bg-[#7A4D43]" : "bg-[#214F43]"}`} style={{ width: `${Math.min(budget.percentage, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}                  </div>
                </>
              )}
            </GlassPanel>
          </div>

          {/* UPCOMING MONEY */}
          <div className="mt-6">
            <GlassPanel className="p-5 md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Upcoming money
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Know what&apos;s coming next.
                  </h3>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Payments, obligations, receivables, and goal deadlines that deserve your attention.
                  </p>
                </div>

                <p className="text-xs font-medium text-[#7B9685]">
                  {upcomingMoney.length > 0
                    ? "Sorted by date"
                    : "Nothing scheduled"}
                </p>
              </div>

              {upcomingMoney.length === 0 ? (
                <div className="mt-7 flex min-h-36 items-center justify-center border-y border-[#DDE6D7]/80 px-6 py-8 text-center">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEDB] text-lg font-semibold text-[#214F43]">
                      ◷
                    </div>

                    <p className="mt-4 text-sm font-semibold">
                      Nothing upcoming
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#7B9685]">
                      Add payment dates, debt due dates, or goal deadlines to make this section useful.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-7 grid gap-3 md:grid-cols-2">
                  {upcomingMoney.map((item) => {
                    const timing = formatUpcomingTiming(item.date);
                    const isOverdue =
                      getDaysUntil(item.date) !== null &&
                      (getDaysUntil(item.date) ?? 0) < 0;

                    const isIncoming =
                      item.kind === "receivable";

                    const isGoal = item.kind === "goal";

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => router.push(item.route)}
                        className="group rounded-[1.5rem] border border-[#DDE6D7] bg-white/45 p-5 text-left transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/70"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                                isIncoming
                                  ? "bg-[#E8EEDB] text-[#214F43]"
                                  : isGoal
                                  ? "bg-[#F0EDE4] text-[#7B9685]"
                                  : "bg-[#F0EDE4] text-[#7A4D43]"
                              }`}
                            >
                              {isIncoming
                                ? "↗"
                                : isGoal
                                ? "◇"
                                : "↘"}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#214F43]">
                                {item.title}
                              </p>

                              <p className="mt-1 truncate text-xs text-[#7B9685]">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                              isOverdue
                                ? "bg-[#FDECEC] text-[#7A4D43]"
                                : timing === "Today" ||
                                  timing === "Tomorrow"
                                ? "bg-[#E8EEDB] text-[#214F43]"
                                : "bg-[#F0EDE4] text-[#7B9685]"
                            }`}
                          >
                            {timing}
                          </span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.16em] text-[#7B9685]">
                              {isIncoming
                                ? "Expected in"
                                : isGoal
                                ? "Still needed"
                                : "Amount"}
                            </p>

                            <p
                              className={`mt-1 text-base font-bold ${
                                isIncoming
                                  ? "text-[#214F43]"
                                  : isGoal
                                  ? "text-[#173C34]"
                                  : "text-[#7A4D43]"
                              }`}
                            >
                              {formatCurrency(item.amount)}
                            </p>
                          </div>

                          <span className="text-xs font-semibold text-[#214F43] transition-transform duration-200 group-hover:translate-x-1">
                            View →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </div>

          {/* SPENDING + SUBSCRIPTIONS */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* SPENDING */}
            <GlassPanel className="p-5 md:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Spending
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Where your money goes.
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/transactions")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#DDE6D7] bg-white/60 text-[#214F43] transition-colors duration-200 hover:bg-white"
                >
                  →
                </button>
              </div>

              {categorySpending.length === 0 ? (
                <EmptyState
                  icon="◌"
                  title="No spending data"
                  description="Categorized expenses will appear here."
                  buttonLabel="Add Expense"
                  onClick={() =>
                    router.push("/transactions")
                  }
                />
              ) : (
                <>
                  {topSpendingCategory && (
                    <div className="mt-7 rounded-[1.5rem] border border-[#DDE6D7] bg-[#E8EEDB]/55 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                            Spending focus
                          </p>

                          <p className="mt-2 text-lg font-bold tracking-tight text-[#214F43]">
                            {topSpendingCategory.name}
                          </p>

                          <p className="mt-1 max-w-sm text-xs leading-5 text-[#5F7168]">
                            Your largest spending category this month, accounting for {topSpendingCategory.percentage.toFixed(1)}% of total expenses.
                          </p>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-xl font-bold text-[#173C34]">
                            {formatCurrency(
                              topSpendingCategory.amount
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-[#7B9685]">
                            {spendingCategoryCount} {spendingCategoryCount === 1 ? "category" : "categories"} this month
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-7 space-y-5">
                    {categorySpending
                      .slice(0, 5)
                      .map((category, index) => (
                        <div key={category.id}>
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8EEDB] text-xs font-bold text-[#214F43]">
                                {index + 1}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {category.name}
                                </p>

                                <p className="text-[10px] text-[#7B9685]">
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

                          <div className="h-2 overflow-hidden rounded-full bg-[#DDE6D7]">
                            <div
                              className="h-full rounded-full bg-[#7B9685] transition-[width] duration-500"
                              style={{
                                width: `${Math.min(
                                  category.percentage,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>

                  {categorySpending.length > 5 && (
                    <button
                      type="button"
                      onClick={() => router.push("/transactions")}
                      className="mt-6 text-xs font-semibold text-[#214F43] transition-colors duration-200 hover:text-[#173C34]"
                    >
                      View all {categorySpending.length} categories →
                    </button>
                  )}
                </>
              )}
            </GlassPanel>

            {/* SUBSCRIPTIONS */}
            <GlassPanel
              className="p-5 md:p-7"
              green={hasSubscriptions}
            >
              {hasSubscriptions ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                        Recurring
                      </p>

                      <h3 className="mt-2 text-xl font-semibold text-white">
                        Subscriptions.
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/subscriptions")
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
                    >
                      →
                    </button>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <DarkMetric
                      label="Active"
                      value={String(
                        subscriptionSummary.activeCount
                      )}
                    />

                    <DarkMetric
                      label="Monthly"
                      value={formatCurrency(
                        Math.round(
                          subscriptionSummary.monthlyCost
                        )
                      )}
                    />
                  </div>

                  {subscriptionSummary.nextPayment && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                        Next payment
                      </p>

                      <div className="mt-3 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold text-white">
                            {
                              subscriptionSummary
                                .nextPayment.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-white/50">
                            {formatSubscriptionDate(
                              subscriptionSummary
                                .nextPayment
                                .next_payment_date
                            )}
                          </p>
                        </div>

                        <p className="text-lg font-bold text-[#C8D8BE]">
                          {formatCurrency(
                            subscriptionSummary
                              .nextPayment.amount
                          )}
                        </p>
                      </div>

                      <p className="mt-3 text-[10px] text-white/40">
                        {formatBillingCycle(
                          subscriptionSummary.nextPayment
                            .billing_cycle
                        )}
                        {subscriptionSummary.nextPayment
                          .category
                          ? ` · ${subscriptionSummary.nextPayment.category}`
                          : ""}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Recurring
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Subscriptions.
                  </h3>

                  <EmptyState
                    icon="◌"
                    title="No active subscriptions"
                    description="Add recurring payments to keep track of them."
                    buttonLabel="Add Subscription"
                    onClick={() =>
                      router.push("/subscriptions")
                    }
                  />
                </>
              )}
            </GlassPanel>
          </div>

          {/* DEBTS */}
          <div className="mt-6">
            <GlassPanel className="p-5 md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Debts & receivables
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Keep your obligations clear.
                  </h3>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Money you owe and money owed to you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/debts")}
                  className="w-fit rounded-full border border-[#DDE6D7] bg-white/60 px-4 py-2.5 text-xs font-semibold text-[#214F43] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
                >
                  Manage Debts →
                </button>
              </div>

              {!hasDebts ? (
                <EmptyState
                  icon="%"
                  title="Nothing outstanding"
                  description="Add a debt or receivable when you need to track one."
                  buttonLabel="Add Debt"
                  onClick={() => router.push("/debts")}
                />
              ) : (
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="Total Debt"
                    value={formatCurrency(
                      debtSummary.totalDebt
                    )}
                  />

                  <MetricCard
                    label="Receivable"
                    value={formatCurrency(
                      debtSummary.totalReceivable
                    )}
                  />

                  <MetricCard
                    label="Outstanding"
                    value={`${debtSummary.outstandingCount} items`}
                  />
                </div>
              )}

              {hasDebts && debtSummary.nextDue && (
                <div className="mt-6 border-y border-[#DDE6D7] bg-[#E8EEDB]/35 px-1 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                        Next due
                      </p>

                      <p className="mt-2 text-lg font-bold">
                        {debtSummary.nextDue.name}
                      </p>

                      <p className="mt-1 text-xs text-[#7B9685]">
                        {debtSummary.nextDue.type === "debt"
                          ? "You owe"
                          : "Owed to you"}
                        {" · "}
                        {formatDebtDate(
                          debtSummary.nextDue.due_date
                        )}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-[9px] text-[#7B9685]">
                        Remaining
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {formatCurrency(
                          debtSummary.nextDue.remaining_amount
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </GlassPanel>
          </div>

          {/* ACTION CENTER */}
          <div className="mt-6">
            <GlassPanel className="p-5 md:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Action center
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    What deserves your attention.
                  </h3>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-[#7B9685]">
                    A short list of practical next steps based on your current financial picture.
                  </p>
                </div>

                <span className="text-xs font-medium text-[#7B9685]">
                  {visibleActions.length} {visibleActions.length === 1 ? "priority" : "priorities"}
                </span>
              </div>

              <div className="mt-7 space-y-3">
                {visibleActions.map((action, index) => {
                  const priorityStyles =
                    action.priority === "high"
                      ? "bg-[#FDECEC] text-[#7A4D43]"
                      : action.priority === "medium"
                      ? "bg-[#E8EEDB] text-[#214F43]"
                      : "bg-[#F0EDE4] text-[#7B9685]";

                  return (
                    <div
                      key={action.id}
                      className="flex flex-col gap-5 rounded-[1.5rem] border border-[#DDE6D7] bg-white/45 p-5 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E8EEDB] text-xs font-bold text-[#214F43]">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#214F43]">
                              {action.title}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] ${priorityStyles}`}
                            >
                              {action.priority}
                            </span>
                          </div>

                          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#7B9685]">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(action.route)}
                        className="group flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#DDE6D7] bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#214F43] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white"
                      >
                        {action.actionLabel}
                        <span className="transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="mt-6">
            <GlassPanel className="p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                    Activity
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Recent transactions.
                  </h3>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Your latest financial activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/transactions")
                  }
                  className="group flex shrink-0 items-center gap-2 text-xs font-semibold text-[#214F43]"
                >
                  View all
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon="＋"
                  title="No transactions yet"
                  description="Add your first transaction to see your activity here."
                  buttonLabel="Add Transaction"
                  onClick={() =>
                    router.push("/transactions")
                  }
                />
              ) : (
                <div className="mt-7 space-y-2">
                  {recentTransactions.map((transaction) => {
                    const category = categories.find(
                      (item) =>
                        item.id === transaction.category_id
                    );

                    return (
                      <div
                        key={transaction.id}
                        className="group flex flex-col gap-4 border-b border-[#DDE6D7] px-1 py-5 transition-[background-color,padding] duration-200 hover:bg-white/45 sm:flex-row sm:items-center sm:justify-between sm:hover:px-3"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${
                              transaction.type === "income"
                                ? "bg-[#E8EEDB] text-[#214F43]"
                                : "bg-[#F0EDE4] text-[#7B9685]"
                            }`}
                          >
                            {transaction.type === "income"
                              ? "↗"
                              : "↘"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {transaction.description}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#7B9685]">
                              {category?.name ||
                                "Uncategorized"}
                              {" · "}
                              {transaction.transaction_date}
                              {transaction.payment_method
                                ? ` · ${formatPaymentMethod(
                                    transaction.payment_method
                                  )}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`shrink-0 text-base font-bold ${
                            transaction.type === "income"
                              ? "text-[#214F43]"
                              : "text-[#173C34]"
                          }`}
                        >
                          {transaction.type === "income"
                            ? "+"
                            : "-"}{" "}
                          {formatCurrency(
                            transaction.amount
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </div>

          {/* BOTTOM CTA */}
          <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/40 bg-[#214F43] p-8 shadow-[0_20px_50px_rgba(33,79,67,0.12)] md:p-10">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundImage:
                  "url('/ordiva-hero-bg.jpg')",
              }}
            />

            <div className="absolute inset-0 bg-[#173C34]/65" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8D8BE]">
                  Keep moving forward
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                  Small steps. Better financial habits.
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                  Use your data to make your next
                  financial decision with confidence.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/reports")}
                className="group shrink-0 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/20"
              >
                Open Reports
                <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-10 flex flex-col gap-3 border-t border-[#DDE6D7] pt-6 text-xs text-[#7B9685] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Ordiva · Plan Smarter. Live Brighter.
            </p>

            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="transition-colors duration-200 hover:text-[#214F43]"
              >
                Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="transition-colors duration-200 hover:text-[#214F43] disabled:opacity-50"
              >
                {loggingOut
                  ? "Logging out..."
                  : "Log out"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function GlassPanel({
  children,
  className = "",
  green = false,
}: {
  children: React.ReactNode;
  className?: string;
  green?: boolean;
}) {
  return (
    <div
      className={`relative ${
        green
          ? "overflow-hidden rounded-[2rem] border border-white/20 bg-[#214F43] shadow-[0_20px_50px_rgba(33,79,67,0.12)]"
          : "rounded-[2rem] border border-[#DDE6D7] bg-white/40 shadow-[0_12px_35px_rgba(23,60,52,0.045)] backdrop-blur-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon,
  highlight = false,
  comparison,
  comparisonLabel,
  inverseComparison = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
  comparison?: number | null;
  comparisonLabel?: string;
  inverseComparison?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_14px_35px_rgba(0,0,0,0.10)] backdrop-blur-lg transition-transform duration-200 hover:-translate-y-0.5 ${
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

          {comparison !== undefined && (
            <p className="mt-1 text-[9px] text-white/45">
              {comparison === null ? (
                <>New this month · {comparisonLabel}</>
              ) : comparison === 0 ? (
                <>No change · {comparisonLabel}</>
              ) : (
                <>
                  <span
                    className={
                      inverseComparison
                        ? comparison < 0
                          ? "text-[#C8D8BE]"
                          : "text-white/70"
                        : comparison > 0
                        ? "text-[#C8D8BE]"
                        : "text-white/70"
                    }
                  >
                    {comparison > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(comparison).toFixed(1)}%
                  </span>{" "}
                  {comparisonLabel}
                </>
              )}
            </p>
          )}
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

function ChartLegend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-semibold text-[#5F7168]">
      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />
      {label}
    </div>
  );
}

function MetricCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="border-t border-[#DDE6D7] py-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7B9685]">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          danger ? "text-red-700" : "text-[#173C34]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-[9px] uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-7 flex min-h-36 items-center justify-center border-y border-[#DDE6D7]/80 px-6 py-8 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEDB] text-lg font-semibold text-[#214F43]">
          {icon}
        </div>

        <p className="mt-4 text-sm font-semibold">
          {title}
        </p>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#7B9685]">
          {description}
        </p>

        <button
          type="button"
          onClick={onClick}
          className="mt-4 rounded-full bg-[#214F43] px-4 py-2.5 text-xs font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#173C34]"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}