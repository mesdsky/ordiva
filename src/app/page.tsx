"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FeatureKey =
  | "dashboard"
  | "transactions"
  | "goals"
  | "budget"
  | "subscriptions"
  | "debts";

type FeatureDetail = {
  title: string;
  eyebrow: string;
  overview: string;
  bullets: string[];
  route: string;
};

const featureDetails: Record<FeatureKey, FeatureDetail> = {
  dashboard: {
    title: "Dashboard",
    eyebrow: "Your financial overview",
    overview:
      "See your balance, income, expenses, savings, and progress in one clear view.",
    bullets: [
      "Monthly financial snapshot",
      "Cash-flow and savings overview",
      "Quick access to your goals",
    ],
    route: "/dashboard",
  },
  transactions: {
    title: "Transactions",
    eyebrow: "Every movement, organized",
    overview:
      "Record income and expenses quickly, then keep your financial activity easy to understand.",
    bullets: [
      "Fast income and expense entry",
      "Category-based organization",
      "Clear monthly activity history",
    ],
    route: "/transactions",
  },
  goals: {
    title: "Financial Goals",
    eyebrow: "Make progress visible",
    overview:
      "Set meaningful targets and follow your progress as you build better money habits.",
    bullets: [
      "Create specific savings targets",
      "Track progress toward each goal",
      "Stay motivated with clear milestones",
    ],
    route: "/goals",
  },
  budget: {
    title: "Smart Budget",
    eyebrow: "Spend with intention",
    overview:
      "Plan your monthly spending and always know how much room you have left.",
    bullets: [
      "Set monthly category limits",
      "Monitor remaining budget",
      "Spot overspending early",
    ],
    route: "/budget",
  },
  subscriptions: {
    title: "Subscriptions",
    eyebrow: "Never miss a recurring payment",
    overview:
      "Keep recurring payments visible so you can plan ahead and avoid forgotten charges.",
    bullets: [
      "Track recurring services",
      "See upcoming payment dates",
      "Understand your monthly commitments",
    ],
    route: "/subscriptions",
  },
  debts: {
    title: "Debt Tracker",
    eyebrow: "A clearer path forward",
    overview:
      "Organize your debts, monitor repayments, and make progress toward financial freedom.",
    bullets: [
      "Keep every debt in one place",
      "Track repayment progress",
      "See what still needs attention",
    ],
    route: "/debts",
  },
};

export default function Home() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] =
    useState<FeatureKey | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedFeature) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedFeature(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedFeature]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F2E8] text-[#173C34]">
      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/45 bg-[#F5F2E8]/55 px-2.5 py-2 shadow-[0_12px_40px_rgba(23,60,52,0.08)] backdrop-blur-md sm:px-5 sm:py-2.5">
          {/* ORIGINAL ORDIVA LOGO — DO NOT CHANGE */}
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Ordiva home"
            className="group flex items-center"
          >
            <img
              src="/ordiva-navbar.png"
              alt="Ordiva"
              className="h-10 w-auto object-contain sm:h-12 transition duration-300 group-hover:scale-[1.03]"
            />
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-[#7B9685]"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#7B9685]"
            >
              How it works
            </a>

            <a
              href="#overview"
              className="transition-colors hover:text-[#7B9685]"
            >
              Overview
            </a>
          </div>

          {/* Glass actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full border border-white/50 bg-white/25 px-2.5 py-2 text-xs font-semibold text-[#173C34] whitespace-nowrap sm:px-4 sm:py-2.5 sm:text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-300 hover:-translate-y-0.5 hover:bg-white/45"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="group relative overflow-hidden rounded-full border border-white/35 bg-[#214F43]/90 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap sm:px-5 sm:py-2.5 sm:text-sm shadow-[0_10px_30px_rgba(33,79,67,0.22),inset_0_1px_0_rgba(255,255,255,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#173C34]"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-white/70" />
              <span className="relative flex items-center gap-2 whitespace-nowrap">
                Get Started
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Photography background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/ordiva-hero-bg.jpg')",
          }}
        />

        {/* Editorial overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#102F29]/90 via-[#173C34]/65 to-[#173C34]/20" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#173C34]/45 via-transparent to-[#173C34]/10" />

        {/* Ambient glass blobs */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-[#AFC1A4]/20 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gradient-to-bl from-white/10 to-transparent" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-32 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-36 md:px-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
          {/* LEFT CONTENT */}
          <div
            className={`max-w-2xl transition-all duration-1000 ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            {/* Eyebrow glass */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <span className="h-2 w-2 rounded-full bg-[#AFC1A4] shadow-[0_0_12px_rgba(175,193,164,0.8)]" />
              A smarter way to manage your money
            </div>

            <h1 className="text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl text-white sm:text-6xl md:text-7xl lg:text-[5.6rem]">
              Plan Smarter.
              <br />
              <span className="text-[#C8D8BE]">
                Live Brighter.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Kelola keuangan dengan lebih sederhana,
              rapi, dan terarah. Pantau uangmu, bangun
              goals, dan buat keputusan finansial dengan
              lebih percaya diri.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="group relative overflow-hidden rounded-full border border-white/30 bg-[#214F43]/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.35)] transition duration-300 hover:-translate-y-1 hover:bg-[#173C34] sm:px-7 sm:py-4"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-white/80" />
                <span className="absolute -left-20 top-0 h-full w-20 -skew-x-12 bg-white/15 transition-transform duration-700 group-hover:translate-x-[420px]" />

                <span className="relative flex items-center justify-center gap-3">
                  Get Started Free
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>

              <a
                href="#overview"
                className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/30 bg-white/12 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition duration-300 hover:-translate-y-1 hover:bg-white/20 sm:px-7 sm:py-4"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-white/15 text-[10px]">
                  ↓
                </span>
                Explore Ordiva
              </a>
            </div>

            {/* Trust points */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/70">
              <span className="flex items-center gap-2">
                <span className="text-[#C8D8BE]">✓</span>
                Simple to use
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#C8D8BE]">✓</span>
                All-in-one finance
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#C8D8BE]">✓</span>
                Built for progress
              </span>
            </div>
          </div>

          {/* DASHBOARD GLASS */}
          <div
            className={`relative transition-all delay-150 duration-1000 ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Floating badge */}
            <div className="absolute -right-3 -top-7 z-30 hidden rounded-2xl border border-white/35 bg-white/15 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.4)] sm:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                Savings rate
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                32.4%
              </p>
            </div>

            {/* Main glass frame */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/35 bg-white/18 p-2 shadow-[0_35px_100px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md">
              <div className="overflow-hidden rounded-[1.55rem] border border-white/50 bg-[#F5F2E8]/90 shadow-[0_15px_50px_rgba(23,60,52,0.15)]">
                {/* Dashboard top bar */}
                <div className="flex items-center justify-between border-b border-[#DDE6D7] px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                      Overview
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#173C34]">
                      Good morning 👋
                    </p>
                  </div>

                  <div className="rounded-full border border-[#DDE6D7] bg-white px-3 py-1.5 text-[9px] font-semibold text-[#214F43] shadow-sm">
                    September 2026
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
                  <DashboardStat
                    label="Balance"
                    value="Rp 8.24M"
                    dark
                  />

                  <DashboardStat
                    label="Income"
                    value="Rp 5.40M"
                  />

                  <DashboardStat
                    label="Expenses"
                    value="Rp 2.16M"
                  />

                  <DashboardStat
                    label="Savings"
                    value="Rp 3.24M"
                    highlight
                  />
                </div>

                {/* Dashboard lower */}
                <div className="grid gap-3 px-4 pb-4 sm:grid-cols-5 sm:px-5 sm:pb-5">
                  {/* Chart */}
                  <div className="rounded-2xl border border-[#DDE6D7] bg-white/65 p-4 sm:col-span-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#173C34]">
                          Cash Flow
                        </p>

                        <p className="mt-1 text-[9px] text-[#7B9685]">
                          Income vs expenses
                        </p>
                      </div>

                      <span className="rounded-full bg-[#E8EEDB] px-2.5 py-1 text-[8px] font-semibold text-[#214F43]">
                        Monthly
                      </span>
                    </div>

                    <div className="mt-6 flex h-32 items-end gap-2">
                      {[35, 52, 43, 66, 57, 74, 63, 87].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex h-full flex-1 items-end justify-center gap-1"
                          >
                            <div
                              className="w-[44%] rounded-t-md bg-[#AFC1A4]"
                              style={{
                                height: `${height * 0.65}%`,
                              }}
                            />

                            <div
                              className="w-[44%] rounded-t-md bg-[#214F43]"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-2 flex justify-between text-[8px] text-[#7B9685]">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="rounded-2xl bg-[#E8EEDB] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#173C34]">
                          Financial Goal
                        </p>

                        <p className="mt-1 text-[9px] text-[#7B9685]">
                          Emergency Fund
                        </p>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#214F43] text-xs text-white">
                        ◇
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end justify-between">
                        <p className="text-xl font-bold text-[#173C34]">
                          72%
                        </p>

                        <p className="text-[9px] text-[#7B9685]">
                          Rp 7.2M / Rp 10M
                        </p>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/70">
                        <div className="h-full w-[72%] rounded-full bg-[#214F43]" />
                      </div>
                    </div>

                    <p className="mt-5 text-[9px] leading-4 text-[#5F7168]">
                      Keep going. You&apos;re getting closer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating insight */}
            <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-white/35 bg-[#F5F2E8]/80 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.65)] sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#214F43] text-sm text-white shadow-lg">
                  ↗
                </div>

                <div>
                  <p className="text-[9px] text-[#7B9685]">
                    Monthly progress
                  </p>

                  <p className="text-sm font-bold text-[#214F43]">
                    Looking good
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom scroll hint */}
        <a
          href="#features"
          className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 transition hover:text-white sm:flex"
        >
          Scroll to explore
          <span className="animate-bounce">↓</span>
        </a>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section
        id="features"
        className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-12 lg:px-16"
      >
        {/* Soft photographic atmosphere */}
        <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-gradient-to-br from-[#AFC1A4]/20 to-transparent" />
        <div className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#E8EEDB] to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#7B9685]">
                Everything you need
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl">
                Manage your money
                <br />
                with clarity.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-[#5F7168]">
                Semua yang kamu butuhkan untuk memahami,
                mengatur, dan mengembangkan kondisi
                finansialmu dalam satu tempat.
              </p>
            </div>

            <a
              href="#overview"
              className="group flex w-fit items-center gap-3 rounded-full border border-[#BFD0C3] bg-white/50 px-5 py-3 text-sm font-semibold text-[#214F43] shadow-[inset_0_1px_0_white] transition duration-300 hover:-translate-y-0.5 hover:bg-white/80"
            >
              Explore all features
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              featureKey="dashboard"
              title="Dashboard"
              description="Lihat kondisi keuanganmu secara keseluruhan dalam satu dashboard yang sederhana."
              icon="↗"
              featured
              onClick={() => setSelectedFeature("dashboard")}
            />

            <FeatureCard
              featureKey="transactions"
              title="Transactions"
              description="Catat pemasukan dan pengeluaran dengan cepat tanpa spreadsheet yang ribet."
              icon="＋"
              onClick={() => setSelectedFeature("transactions")}
            />

            <FeatureCard
              featureKey="goals"
              title="Financial Goals"
              description="Tetapkan target finansial dan pantau progress sampai tujuanmu tercapai."
              icon="◎"
              onClick={() => setSelectedFeature("goals")}
            />

            <FeatureCard
              featureKey="budget"
              title="Smart Budget"
              description="Buat budget bulanan dan tahu berapa banyak yang masih bisa kamu gunakan."
              icon="▣"
              onClick={() => setSelectedFeature("budget")}
            />

            <FeatureCard
              featureKey="subscriptions"
              title="Subscriptions"
              description="Pantau recurring payments dan subscription agar nggak ada tagihan yang terlewat."
              icon="◌"
              onClick={() => setSelectedFeature("subscriptions")}
            />

            <FeatureCard
              featureKey="debts"
              title="Debt Tracker"
              description="Kelola utang dan kewajiban dengan lebih teratur dan mudah dipantau."
              icon="%"
              onClick={() => setSelectedFeature("debts")}
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS — PHOTO BACKGROUND
      ========================================================= */}
      <section
        id="how-it-works"
        className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-12 lg:px-16"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/ordiva-hero-bg.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-[#173C34]/88" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#173C34]/95 via-[#173C34]/80 to-[#173C34]/65" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#AFC1A4]">
                How it works
              </p>

              <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl">
                Better money habits,
                <br />
                made simple.
              </h2>
            </div>

            <p className="max-w-xl text-lg leading-8 text-white/70">
              Mulai dari mencatat transaksi sampai
              mencapai tujuan finansial, semuanya
              dirancang agar terasa sederhana.
            </p>
          </div>

          <div className="relative mt-16 grid gap-12 md:grid-cols-3">
            <div className="absolute left-[12%] right-[12%] top-7 hidden h-px border-t border-dashed border-white/25 md:block" />

            <StepCard
              number="01"
              title="Create your account"
              description="Buat akun Ordiva dan sesuaikan profil keuanganmu sesuai kebutuhan."
              active
            />

            <StepCard
              number="02"
              title="Track your money"
              description="Catat pemasukan dan pengeluaran untuk memahami ke mana uangmu pergi."
            />

            <StepCard
              number="03"
              title="Make progress"
              description="Gunakan insights, budget, dan goals untuk membangun kebiasaan finansial yang lebih baik."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          OVERVIEW
      ========================================================= */}
      <section
        id="overview"
        className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-12 lg:px-16"
      >
        <div className="pointer-events-none absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#AFC1A4]/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            {/* Text */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#7B9685]">
                See the big picture
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl">
                One dashboard.
                <br />
                Complete clarity.
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#5F7168]">
                Dari balance sampai financial goals,
                Ordiva membantumu melihat apa yang terjadi
                dengan uangmu dan apa yang harus dilakukan
                selanjutnya.
              </p>

              <button
                type="button"
                onClick={() => router.push("/register")}
                className="group mt-8 inline-flex items-center gap-3 rounded-full border border-white/40 bg-[#214F43] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(33,79,67,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] transition duration-300 hover:-translate-y-1 hover:bg-[#173C34]"
              >
                Try Ordiva Now
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>

            {/* Overview glass dashboard */}
            <div className="relative rounded-[2rem] border border-white/60 bg-white/35 p-2 shadow-[0_30px_90px_rgba(23,60,52,0.13),inset_0_1px_0_white] backdrop-blur-md">
              <div className="rounded-[1.55rem] border border-[#DDE6D7] bg-[#F5F2E8]/90 p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
                      Dashboard Overview
                    </p>

                    <h3 className="mt-1 text-base font-semibold text-[#173C34]">
                      Your financial snapshot
                    </h3>
                  </div>

                  <span className="hidden rounded-full bg-[#E8EEDB] px-3 py-1.5 text-[9px] font-semibold text-[#214F43] sm:block">
                    September 2026
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  <OverviewStat
                    label="Total Balance"
                    value="Rp 8.24M"
                    note="+12.4%"
                    dark
                  />

                  <OverviewStat
                    label="Income"
                    value="Rp 5.40M"
                    note="This month"
                  />

                  <OverviewStat
                    label="Expenses"
                    value="Rp 2.16M"
                    note="This month"
                  />

                  <OverviewStat
                    label="Savings"
                    value="Rp 3.24M"
                    note="60% rate"
                    highlight
                  />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-5">
                  {/* Cash flow */}
                  <div className="rounded-2xl border border-[#DDE6D7] bg-white/70 p-5 lg:col-span-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          Cash Flow
                        </h4>

                        <p className="mt-1 text-[9px] text-[#7B9685]">
                          Income and expenses over time
                        </p>
                      </div>

                      <span className="rounded-full bg-[#E8EEDB] px-2.5 py-1 text-[8px] font-semibold text-[#214F43]">
                        Monthly
                      </span>
                    </div>

                    <div className="mt-8 flex h-40 items-end gap-2">
                      {[42, 55, 48, 68, 57, 75, 64, 90].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex h-full flex-1 items-end justify-center gap-1"
                          >
                            <div
                              className="w-[42%] rounded-t-md bg-[#AFC1A4]"
                              style={{
                                height: `${height * 0.62}%`,
                              }}
                            />

                            <div
                              className="w-[42%] rounded-t-md bg-[#214F43]"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-2 flex justify-between text-[8px] text-[#7B9685]">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                    </div>
                  </div>

                  {/* Spending */}
                  <div className="rounded-2xl border border-[#DDE6D7] bg-white/70 p-5 lg:col-span-2">
                    <h4 className="text-sm font-semibold">
                      Spending by Category
                    </h4>

                    <p className="mt-1 text-[9px] text-[#7B9685]">
                      Where your money goes
                    </p>

                    <div className="mt-7 flex items-center gap-6">
                      <div
                        className="relative h-28 w-28 shrink-0 rounded-full"
                        style={{
                          background:
                            "conic-gradient(#214F43 0 32%, #7B9685 32% 53%, #AFC1A4 53% 68%, #C8D8BE 68% 80%, #E8EEDB 80% 100%)",
                        }}
                      >
                        <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-[#F5F2E8]">
                          <span className="text-xs font-bold text-[#214F43]">
                            100%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[9px]">
                        <CategoryLegend
                          label="Food"
                          value="32%"
                          dot="bg-[#214F43]"
                        />

                        <CategoryLegend
                          label="Bills"
                          value="21%"
                          dot="bg-[#7B9685]"
                        />

                        <CategoryLegend
                          label="Transport"
                          value="15%"
                          dot="bg-[#AFC1A4]"
                        />

                        <CategoryLegend
                          label="Shopping"
                          value="12%"
                          dot="bg-[#C8D8BE]"
                        />

                        <CategoryLegend
                          label="Other"
                          value="20%"
                          dot="bg-[#E8EEDB]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA — PHOTO + GLASS
      ========================================================= */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-12 lg:px-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/ordiva-hero-bg.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-[#173C34]/70" />

        <div className="relative mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/25 bg-white/10 px-7 py-16 shadow-[0_30px_90px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.35)] md:px-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#C8D8BE]">
                Start your journey
              </p>

              <h2 className="text-4xl font-semibold tracking-[-0.035em] text-white md:text-5xl lg:text-6xl">
                Take control of your money.
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
                Bangun kebiasaan finansial yang lebih baik
                dan mulai melangkah menuju masa depan
                yang lebih cerah.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="group rounded-full border border-white/30 bg-[#F5F2E8]/95 px-7 py-4 font-semibold text-[#214F43] shadow-[0_15px_40px_rgba(0,0,0,0.15),inset_0_1px_0_white] transition duration-300 hover:-translate-y-1 hover:bg-white"
                >
                  <span className="flex items-center justify-center gap-3">
                    Get Started Free
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </button>

                <a
                  href="#features"
                  className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-[#DDE6D7] bg-[#F5F2E8] px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* ORIGINAL LOGO */}
            <img
              src="/ordiva-navbar.png"
              alt="Ordiva"
              className="h-10 w-auto object-contain"
            />

            <span className="hidden text-xs text-[#7B9685] sm:block">
              Plan Smarter. Live Brighter.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-[#7B9685]">
            <a
              href="#features"
              className="transition hover:text-[#214F43]"
            >
              Features
            </a>

            <a
              href="#overview"
              className="transition hover:text-[#214F43]"
            >
              Overview
            </a>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="transition hover:text-[#214F43]"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="transition hover:text-[#214F43]"
            >
              Get Started
            </button>
          </div>

          <p className="text-xs text-[#7B9685]">
            © 2026 Ordiva
          </p>
        </div>
      </footer>

      {selectedFeature && (
        <FeaturePreviewModal
          featureKey={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onOpen={() =>
            router.push(featureDetails[selectedFeature].route)
          }
        />
      )}
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function DashboardStat({
  label,
  value,
  dark = false,
  highlight = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 ${
        dark
          ? "bg-[#214F43] text-white"
          : highlight
          ? "bg-[#E8EEDB]"
          : "border border-[#DDE6D7] bg-white/70"
      }`}
    >
      <p
        className={`text-[8px] ${
          dark ? "text-white/60" : "text-[#7B9685]"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-bold ${
          dark ? "text-white" : "text-[#173C34]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  featureKey,
  title,
  description,
  icon,
  featured = false,
  onClick,
}: {
  featureKey: FeatureKey;
  title: string;
  description: string;
  icon: string;
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Preview ${title}`}
      aria-haspopup="dialog"
      data-feature-key={featureKey}
      className={`group relative block w-full overflow-hidden rounded-[1.5rem] p-5 text-left sm:rounded-[1.7rem] sm:p-7 transition-all duration-500 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#214F43] focus-visible:ring-offset-4 ${
        featured
          ? "bg-[#214F43] text-white shadow-[0_25px_60px_rgba(33,79,67,0.16)]"
          : "border border-[#DDE6D7] bg-white/55 shadow-[0_15px_40px_rgba(23,60,52,0.04)] hover:border-[#BFD0C3] hover:bg-white/75 hover:shadow-[0_25px_60px_rgba(23,60,52,0.08)]"
      }`}
    >
      {/* Gloss */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br to-transparent ${
          featured
            ? "from-[#AFC1A4]/20"
            : "from-[#AFC1A4]/15"
        }`}
      />

      <div
        className={`relative mb-5 flex h-11 w-11 sm:mb-7 sm:h-12 sm:w-12 items-center justify-center rounded-2xl text-lg shadow-sm transition duration-300 group-hover:scale-105 group-hover:rotate-2 ${
          featured
            ? "border border-white/20 bg-white/15 text-white"
            : "bg-[#E8EEDB] text-[#214F43]"
        }`}
      >
        {icon}
      </div>

      <h3
        className={`relative text-lg font-semibold sm:text-xl ${
          featured ? "text-white" : "text-[#173C34]"
        }`}
      >
        {title}
      </h3>

      <p
        className={`relative mt-2.5 leading-6 sm:mt-3 sm:leading-7 ${
          featured ? "text-white/65" : "text-[#5F7168]"
        }`}
      >
        {description}
      </p>

      <div
        className={`relative mt-5 flex translate-y-0 sm:mt-7 items-center gap-2 text-xs font-semibold opacity-100 transition-all duration-300 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 ${
          featured ? "text-[#C8D8BE]" : "text-[#214F43]"
        }`}
      >
        <span className="lg:hidden">Tap to explore</span>
        <span className="hidden lg:inline">Explore feature</span>
        <span>→</span>
      </div>
    </button>
  );
}

function FeaturePreviewModal({
  featureKey,
  onClose,
  onOpen,
}: {
  featureKey: FeatureKey;
  onClose: () => void;
  onOpen: () => void;
}) {
  const detail = featureDetails[featureKey];

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#102F29]/50 p-4 sm:p-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center py-4">
        <div
          className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-[#F5F2E8] shadow-[0_30px_100px_rgba(16,47,41,0.3)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feature-preview-title"
        >
          <div className="flex items-start justify-between gap-6 border-b border-[#DDE6D7] px-5 py-5 sm:px-8 sm:py-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7B9685]">
                {detail.eyebrow}
              </p>
              <h2
                id="feature-preview-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#173C34] sm:text-3xl"
              >
                {detail.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close feature preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DDE6D7] bg-white/70 text-lg text-[#214F43] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#214F43]"
            >
              ×
            </button>
          </div>

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-base leading-7 text-[#5F7168]">
                {detail.overview}
              </p>

              <ul className="mt-6 space-y-3">
                {detail.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 text-sm text-[#214F43]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8EEDB] text-xs font-bold text-[#214F43]">
                      ✓
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onOpen}
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#214F43] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(33,79,67,0.18)] transition hover:-translate-y-0.5 hover:bg-[#173C34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#214F43] focus-visible:ring-offset-4"
              >
                Open {detail.title}
                <span>→</span>
              </button>
            </div>

            <FeaturePreviewCanvas featureKey={featureKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePreviewCanvas({
  featureKey,
}: {
  featureKey: FeatureKey;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#DDE6D7] bg-white/75 p-3 shadow-[0_20px_50px_rgba(23,60,52,0.08)] sm:p-4">
      <div className="flex items-center justify-between border-b border-[#DDE6D7] px-2 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#AFC1A4]" />
          <span className="h-2 w-2 rounded-full bg-[#DDE6D7]" />
          <span className="h-2 w-2 rounded-full bg-[#DDE6D7]" />
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7B9685]">
          Ordiva preview
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-[#DDE6D7] bg-[#F5F2E8] p-4 sm:p-5">
        {featureKey === "dashboard" && <DashboardPreview />}
        {featureKey === "transactions" && <TransactionsPreview />}
        {featureKey === "goals" && <GoalsPreview />}
        {featureKey === "budget" && <BudgetPreview />}
        {featureKey === "subscriptions" && <SubscriptionsPreview />}
        {featureKey === "debts" && <DebtsPreview />}
      </div>
    </div>
  );
}

function PreviewHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
          {eyebrow}
        </p>
        <p className="mt-1 text-base font-semibold text-[#173C34]">
          {title}
        </p>
      </div>
      <span className="rounded-full bg-[#E8EEDB] px-2.5 py-1 text-[8px] font-semibold text-[#214F43]">
        September 2026
      </span>
    </div>
  );
}

function MiniProgress({
  value,
  color = "bg-[#214F43]",
}: {
  value: string;
  color?: string;
}) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DDE6D7]">
      <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
    </div>
  );
}

function DashboardPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Overview" title="Good morning 👋" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DashboardStat label="Balance" value="Rp 8.24M" dark />
        <DashboardStat label="Income" value="Rp 5.40M" />
        <DashboardStat label="Expenses" value="Rp 2.16M" />
        <DashboardStat label="Savings" value="Rp 3.24M" highlight />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-[#DDE6D7] bg-white/70 p-3">
          <p className="text-[10px] font-semibold text-[#173C34]">Cash flow</p>
          <div className="mt-5 flex h-24 items-end gap-2">
            {[35, 52, 43, 66, 57, 74, 63, 87].map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end gap-1">
                <div className="w-1/2 rounded-t bg-[#AFC1A4]" style={{ height: `${height * 0.6}%` }} />
                <div className="w-1/2 rounded-t bg-[#214F43]" style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#E8EEDB] p-3">
          <p className="text-[10px] font-semibold text-[#173C34]">Emergency fund</p>
          <p className="mt-4 text-2xl font-bold text-[#173C34]">72%</p>
          <MiniProgress value="72%" />
          <p className="mt-3 text-[9px] text-[#7B9685]">Rp 7.2M of Rp 10M</p>
        </div>
      </div>
    </>
  );
}

function TransactionsPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Activity" title="Your transactions" />
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#214F43] p-4 text-white">
        <div>
          <p className="text-[9px] text-white/60">This month</p>
          <p className="mt-1 text-xl font-bold">Rp 3.24M saved</p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-[9px]">+12.4%</span>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Salary", "Income", "+ Rp 5.40M", "bg-[#E8EEDB]"],
          ["Groceries", "Food & dining", "− Rp 420K", "bg-white"],
          ["Netflix", "Subscription", "− Rp 186K", "bg-white"],
        ].map(([name, category, amount, background]) => (
          <div key={name} className={`flex items-center justify-between rounded-xl border border-[#DDE6D7] ${background} px-3 py-2.5`}>
            <div>
              <p className="text-xs font-semibold text-[#173C34]">{name}</p>
              <p className="mt-0.5 text-[9px] text-[#7B9685]">{category}</p>
            </div>
            <p className={`text-xs font-bold ${amount.startsWith("+") ? "text-[#214F43]" : "text-[#5F7168]"}`}>{amount}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function GoalsPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Your targets" title="Financial goals" />
      <div className="mt-4 rounded-2xl bg-[#214F43] p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/60">Emergency fund</p>
            <p className="mt-1 text-xl font-bold">Rp 7.2M</p>
          </div>
          <span className="text-3xl text-[#C8D8BE]">72%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[72%] rounded-full bg-[#C8D8BE]" />
        </div>
        <p className="mt-2 text-[9px] text-white/60">Rp 2.8M left to reach your goal</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <OverviewStat label="Travel" value="38%" note="Rp 4.1M left" />
        <OverviewStat label="New laptop" value="61%" note="Rp 1.2M left" highlight />
      </div>
    </>
  );
}

function BudgetPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Monthly plan" title="Smart budget" />
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#DDE6D7] bg-white/75 p-4">
        <div>
          <p className="text-[9px] text-[#7B9685]">Remaining budget</p>
          <p className="mt-1 text-2xl font-bold text-[#173C34]">Rp 4.28M</p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-[7px] border-[#AFC1A4] text-xs font-bold text-[#214F43]">
          68%
        </div>
      </div>
      <div className="mt-3 space-y-3 rounded-2xl bg-[#E8EEDB] p-4">
        <BudgetRow label="Needs" value="Rp 1.4M / 2.5M" progress="56%" />
        <BudgetRow label="Lifestyle" value="Rp 740K / 1.5M" progress="49%" />
        <BudgetRow label="Savings" value="Rp 3.2M / 4.0M" progress="80%" color="bg-[#7B9685]" />
      </div>
    </>
  );
}

function BudgetRow({
  label,
  value,
  progress,
  color = "bg-[#214F43]",
}: {
  label: string;
  value: string;
  progress: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[9px]">
        <span className="font-semibold text-[#214F43]">{label}</span>
        <span className="text-[#7B9685]">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div className={`h-full rounded-full ${color}`} style={{ width: progress }} />
      </div>
    </div>
  );
}

function SubscriptionsPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Recurring payments" title="Subscriptions" />
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#E8EEDB] p-4">
        <div>
          <p className="text-[9px] text-[#7B9685]">Monthly commitments</p>
          <p className="mt-1 text-2xl font-bold text-[#173C34]">Rp 486K</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[9px] font-semibold text-[#214F43]">4 active</span>
      </div>
      <div className="mt-3 space-y-2">
        {["Netflix", "Spotify", "Figma"].map((name, index) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-[#DDE6D7] bg-white/75 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#214F43] text-xs text-[#C8D8BE]">{name[0]}</div>
              <div>
                <p className="text-xs font-semibold text-[#173C34]">{name}</p>
                <p className="mt-0.5 text-[9px] text-[#7B9685]">Due in {index + 2} days</p>
              </div>
            </div>
            <p className="text-xs font-bold text-[#214F43]">Rp {index === 0 ? "186K" : index === 1 ? "54K" : "320K"}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function DebtsPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Repayment progress" title="Debt tracker" />
      <div className="mt-4 rounded-2xl bg-[#214F43] p-4 text-white">
        <p className="text-[9px] text-white/60">Total remaining debt</p>
        <p className="mt-1 text-2xl font-bold">Rp 12.6M</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[42%] rounded-full bg-[#C8D8BE]" />
        </div>
        <p className="mt-2 text-[9px] text-white/60">42% paid off</p>
      </div>
      <div className="mt-3 space-y-2 rounded-2xl border border-[#DDE6D7] bg-white/75 p-4">
        <DebtRow name="Motorcycle loan" value="Rp 8.4M" progress="38%" />
        <DebtRow name="Credit card" value="Rp 4.2M" progress="58%" />
      </div>
    </>
  );
}

function DebtRow({
  name,
  value,
  progress,
}: {
  name: string;
  value: string;
  progress: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-semibold text-[#173C34]">{name}</span>
        <span className="text-[#7B9685]">{value}</span>
      </div>
      <MiniProgress value={progress} color="bg-[#7B9685]" />
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  active = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="relative z-10">
      <div
        className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.15)] ${
          active
            ? "border border-white/30 bg-white text-[#214F43]"
            : "border border-white/20 bg-white/10 text-white"
        }`}
      >
        {number}
      </div>

      <h3 className="text-xl font-semibold text-white">
        {title}
      </h3>

      <p className="mt-3 max-w-sm leading-7 text-white/60">
        {description}
      </p>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  note,
  dark = false,
  highlight = false,
}: {
  label: string;
  value: string;
  note: string;
  dark?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        dark
          ? "bg-[#214F43] text-white"
          : highlight
          ? "bg-[#E8EEDB]"
          : "border border-[#DDE6D7] bg-[#F5F2E8]"
      }`}
    >
      <p
        className={`text-[9px] ${
          dark ? "text-white/60" : "text-[#7B9685]"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-base font-bold ${
          dark ? "text-white" : "text-[#173C34]"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-[8px] ${
          dark ? "text-white/60" : "text-[#7B9685]"
        }`}
      >
        {note}
      </p>
    </div>
  );
}

function CategoryLegend({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />

      <span className="min-w-14 text-[#5F7168]">
        {label}
      </span>

      <span className="font-semibold text-[#173C34]">
        {value}
      </span>
    </div>
  );
}