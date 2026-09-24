"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow, Check, featureIcons } from "./icons";
import {
  BudgetRow,
  CashFlowBars,
  DashboardStat,
  DebtRow,
  MiniProgress,
  OverviewStat,
} from "./ui";

type FeatureKey =
  | "dashboard"
  | "transactions"
  | "goals"
  | "budget"
  | "subscriptions"
  | "debts"
  | "reports";

type Feature = {
  title: string;
  eyebrow: string;
  description: string;
  overview: string;
  bullets: string[];
  route: string;
  span: string;
};

const features: Record<FeatureKey, Feature> = {
  dashboard: {
    title: "Dashboard",
    eyebrow: "Your financial overview",
    description:
      "See your whole financial picture in one simple dashboard.",
    overview: "See your balance, income, expenses, savings, and progress in one clear view.",
    bullets: ["Monthly financial snapshot", "Cash-flow and savings overview", "Quick access to your goals"],
    route: "/dashboard",
    span: "lg:col-span-4",
  },
  transactions: {
    title: "Transactions",
    eyebrow: "Every movement, organized",
    description: "Log income and expenses in seconds, without messy spreadsheets.",
    overview:
      "Record income and expenses quickly, then keep your financial activity easy to understand.",
    bullets: ["Fast income and expense entry", "Category-based organization", "Clear monthly activity history"],
    route: "/transactions",
    span: "lg:col-span-2",
  },
  goals: {
    title: "Financial Goals",
    eyebrow: "Make progress visible",
    description: "Set financial targets and follow your progress until you get there.",
    overview: "Set meaningful targets and follow your progress as you build better money habits.",
    bullets: ["Create specific savings targets", "Track progress toward each goal", "Stay motivated with clear milestones"],
    route: "/goals",
    span: "lg:col-span-2",
  },
  budget: {
    title: "Smart Budget",
    eyebrow: "Spend with intention",
    description: "Plan a monthly budget and always know how much you have left.",
    overview: "Plan your monthly spending and always know how much room you have left.",
    bullets: ["Set monthly category limits", "Monitor remaining budget", "Spot overspending early"],
    route: "/budget",
    span: "lg:col-span-2",
  },
  subscriptions: {
    title: "Subscriptions",
    eyebrow: "Never miss a recurring payment",
    description: "Keep an eye on recurring payments so no bill slips through.",
    overview: "Keep recurring payments visible so you can plan ahead and avoid forgotten charges.",
    bullets: ["Track recurring services", "See upcoming payment dates", "Understand your monthly commitments"],
    route: "/subscriptions",
    span: "lg:col-span-2",
  },
  debts: {
    title: "Debt Tracker",
    eyebrow: "A clearer path forward",
    description: "Keep debts and repayments organized and easy to follow.",
    overview: "Organize your debts, monitor repayments, and make progress toward financial freedom.",
    bullets: ["Keep every debt in one place", "Track repayment progress", "See what still needs attention"],
    route: "/debts",
    span: "lg:col-span-3",
  },
  reports: {
    title: "Reports",
    eyebrow: "Learn from your patterns",
    description: "Spot monthly trends and your biggest spending categories to decide better.",
    overview: "Compare months, find your biggest spending categories, and see how your habits change over time.",
    bullets: ["Month-to-month comparisons", "Spending by category", "Trends you can act on"],
    route: "/reports",
    span: "lg:col-span-3",
  },
};

const order = Object.keys(features) as FeatureKey[];

export default function Features() {
  const [selected, setSelected] = useState<FeatureKey | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const open = (key: FeatureKey, event: React.MouseEvent<HTMLElement>) => {
    openerRef.current = event.currentTarget;
    setSelected(key);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {order.map((key, index) => {
          const feature = features[key];
          const featured = key === "dashboard";
          return (
            <button
              key={key}
              type="button"
              onClick={(event) => open(key, event)}
              aria-haspopup="dialog"
              data-reveal="tilt"
              style={{ ["--d" as string]: `${(index % 3) * 90}ms` }}
              className={`spotlight group relative flex min-h-[21rem] flex-col overflow-hidden rounded-[1.75rem] p-6 text-left transition-[translate,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-4 focus-visible:ring-offset-cream sm:p-7 ${
                feature.span
              } ${featured ? "md:col-span-2" : ""} ${
                featured
                  ? "bg-forest text-white shadow-[0_30px_70px_rgba(33,79,67,0.25)]"
                  : "border border-line bg-white/60 shadow-[0_15px_40px_rgba(23,60,52,0.04)] hover:border-mint hover:shadow-[0_30px_60px_rgba(23,60,52,0.1)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
                    featured ? "border border-white/20 bg-white/10 text-mint" : "bg-mist text-forest"
                  }`}
                >
                  {featureIcons[key]}
                </span>
                <span
                  className={`font-mono text-[11px] ${featured ? "text-white/40" : "text-sage/70"}`}
                >
                  0{index + 1}
                </span>
              </div>

              <h3
                className={`mt-6 text-xl font-semibold tracking-[-0.02em] sm:text-2xl ${
                  featured ? "text-white" : "text-ink"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`mt-2 max-w-md text-[15px] leading-6 ${
                  featured ? "text-white/65" : "text-slate"
                }`}
              >
                {feature.description}
              </p>

              <div className="mt-auto pt-6">
                <CardVisual featureKey={key} />
              </div>

              <span
                className={`mt-5 flex items-center gap-2 text-xs font-semibold ${
                  featured ? "text-mint" : "text-forest"
                }`}
              >
                <span className="relative">
                  Preview {feature.title.toLowerCase()}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 group-hover:scale-x-100" />
                </span>
                <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="feature-preview-title"
        onClose={() => {
          setSelected(null);
          openerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        className="sheet m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-[2rem] border border-white/70 bg-cream p-0 text-ink shadow-[0_30px_100px_rgba(16,47,41,0.35)] backdrop:bg-transparent"
      >
        {selected && (
          <FeaturePreview
            featureKey={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </dialog>
    </>
  );
}

function FeaturePreview({ featureKey, onClose }: { featureKey: FeatureKey; onClose: () => void }) {
  const detail = features[featureKey];
  return (
    <div data-observe data-shown>
      <div className="flex items-start justify-between gap-6 border-b border-line px-5 py-5 sm:px-8 sm:py-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.22em] text-sage uppercase">{detail.eyebrow}</p>
          <h2
            id="feature-preview-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl"
          >
            {detail.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close feature preview"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/70 text-forest transition duration-300 hover:rotate-90 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-base leading-7 text-slate">{detail.overview}</p>
          <ul className="mt-6 space-y-3">
            {detail.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm text-forest">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mist text-forest">
                  <Check />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          <Link
            href={detail.route}
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(33,79,67,0.18)] transition hover:-translate-y-0.5 hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-4"
          >
            Open {detail.title}
            <Arrow className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-line bg-white/75 p-3 shadow-[0_20px_50px_rgba(23,60,52,0.08)] sm:p-4">
          <div className="flex items-center justify-between border-b border-line px-2 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-moss" />
              <span className="h-2 w-2 rounded-full bg-line" />
              <span className="h-2 w-2 rounded-full bg-line" />
            </div>
            <span className="text-[9px] font-semibold tracking-[0.16em] text-sage uppercase">
              Ordiva preview
            </span>
          </div>
          <div className="mt-3 rounded-2xl border border-line bg-cream p-4 sm:p-5">
            {previews[featureKey]}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Card mini visuals ---------- */

function CardVisual({ featureKey }: { featureKey: FeatureKey }) {
  switch (featureKey) {
    case "dashboard":
      return (
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Balance", "8.24M"],
              ["Income", "5.40M"],
              ["Expenses", "2.16M"],
              ["Savings", "3.24M"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                <p className="text-[9px] text-white/50">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">Rp {value}</p>
              </div>
            ))}
          </div>
          <div data-observe className="flex h-28 items-end gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] p-3">
            {[35, 52, 43, 66, 57, 74, 63, 87, 70, 92].map((h, i) => (
              <div
                key={i}
                data-grow
                className="flex-1 rounded-t bg-mint/80 transition-colors duration-300 group-hover:bg-mint"
                style={{ height: `${h}%`, ["--d" as string]: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      );
    case "transactions":
      return (
        <div className="relative h-[7.5rem] overflow-hidden">
          <div className="space-y-2 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[2.6rem]">
            {[
              ["Salary", "+ Rp 5.40M", true],
              ["Groceries", "- Rp 420K", false],
              ["Netflix", "- Rp 186K", false],
              ["Coffee", "- Rp 28K", false],
            ].map(([name, amount, income]) => (
              <div
                key={name as string}
                className="flex h-[2.1rem] items-center justify-between rounded-xl border border-line bg-cream px-3 text-xs"
              >
                <span className="font-medium text-ink">{name}</span>
                <span className={`font-semibold ${income ? "text-forest" : "text-slate"}`}>{amount}</span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/80 to-transparent" />
        </div>
      );
    case "goals":
      return (
        <div data-observe className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <div className="absolute inset-0 rounded-full bg-mist" />
            <div
              className="donut absolute inset-0 rounded-full"
              style={{ background: "conic-gradient(var(--color-forest) 0 72%, transparent 72%)" }}
            />
            <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-white text-sm font-bold text-ink">
              72%
            </div>
          </div>
          <div className="text-xs">
            <p className="font-semibold text-ink">Emergency fund</p>
            <p className="mt-1 text-sage">Rp 7.2M of Rp 10M</p>
            <p className="mt-2 inline-flex rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-forest">
              3 months to go
            </p>
          </div>
        </div>
      );
    case "budget":
      return (
        <div data-observe className="space-y-3 rounded-2xl bg-mist p-4">
          <BudgetRow label="Needs" value="56%" progress="56%" />
          <BudgetRow label="Lifestyle" value="49%" progress="49%" />
          <BudgetRow label="Savings" value="80%" progress="80%" color="bg-sage" />
        </div>
      );
    case "subscriptions":
      return (
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[9px] font-semibold text-sage">
              {d}
            </span>
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const due = i === 3 || i === 9;
            return (
              <span
                key={i}
                className={`flex aspect-square items-center justify-center rounded-lg text-[10px] transition-colors duration-300 ${
                  due
                    ? "bg-forest font-semibold text-white group-hover:bg-ink"
                    : "bg-cream text-slate group-hover:bg-mist"
                } ${i === 3 ? "pulse-ring" : ""}`}
              >
                {i + 14}
              </span>
            );
          })}
        </div>
      );
    case "debts":
      return (
        <div data-observe className="space-y-3">
          <DebtRow name="Motorcycle loan" value="38% paid" progress="38%" />
          <DebtRow name="Credit card" value="58% paid" progress="58%" />
        </div>
      );
    case "reports":
      return (
        <div data-observe className="relative h-24">
          <svg viewBox="0 0 300 90" className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="report-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#AFC1A4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#AFC1A4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 70 C40 60 60 72 90 52 S150 40 180 44 S240 18 300 12 V90 H0Z" fill="url(#report-fill)" />
            <path
              d="M0 70 C40 60 60 72 90 52 S150 40 180 44 S240 18 300 12"
              fill="none"
              stroke="#214F43"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={1}
              className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)] [[data-shown]_&]:[stroke-dashoffset:0]"
            />
          </svg>
          <span className="absolute top-0 right-0 rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-forest">
            Savings +12.4%
          </span>
        </div>
      );
  }
}

/* ---------- Dialog previews (ported from the original landing page) ---------- */

function PreviewHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[9px] font-semibold tracking-[0.2em] text-sage uppercase">{eyebrow}</p>
        <p className="mt-1 text-base font-semibold text-ink">{title}</p>
      </div>
      <span className="rounded-full bg-mist px-2.5 py-1 text-[9px] font-semibold text-forest">
        September 2026
      </span>
    </div>
  );
}

const previews: Record<FeatureKey, React.ReactNode> = {
  dashboard: (
    <>
      <PreviewHeading eyebrow="Overview" title="Good morning" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DashboardStat label="Balance" value="Rp 8.24M" dark />
        <DashboardStat label="Income" value="Rp 5.40M" />
        <DashboardStat label="Expenses" value="Rp 2.16M" />
        <DashboardStat label="Savings" value="Rp 3.24M" highlight />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-line bg-white/70 p-3">
          <p className="text-[10px] font-semibold text-ink">Cash flow</p>
          <CashFlowBars heights={[35, 52, 43, 66, 57, 74, 63, 87]} className="mt-5 h-24" ratio={0.6} />
        </div>
        <div className="rounded-2xl bg-mist p-3">
          <p className="text-[10px] font-semibold text-ink">Emergency fund</p>
          <p className="mt-4 text-2xl font-bold text-ink">72%</p>
          <MiniProgress value="72%" />
          <p className="mt-3 text-[10px] text-sage">Rp 7.2M of Rp 10M</p>
        </div>
      </div>
    </>
  ),
  transactions: (
    <>
      <PreviewHeading eyebrow="Activity" title="Your transactions" />
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-forest p-4 text-white">
        <div>
          <p className="text-[10px] text-white/60">This month</p>
          <p className="mt-1 text-xl font-bold">Rp 3.24M saved</p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px]">+12.4%</span>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Salary", "Income", "+ Rp 5.40M", "bg-mist"],
          ["Groceries", "Food & dining", "- Rp 420K", "bg-white"],
          ["Netflix", "Subscription", "- Rp 186K", "bg-white"],
        ].map(([name, category, amount, background]) => (
          <div
            key={name}
            className={`flex items-center justify-between rounded-xl border border-line ${background} px-3 py-2.5`}
          >
            <div>
              <p className="text-xs font-semibold text-ink">{name}</p>
              <p className="mt-0.5 text-[10px] text-sage">{category}</p>
            </div>
            <p className={`text-xs font-bold ${amount.startsWith("+") ? "text-forest" : "text-slate"}`}>{amount}</p>
          </div>
        ))}
      </div>
    </>
  ),
  goals: (
    <>
      <PreviewHeading eyebrow="Your targets" title="Financial goals" />
      <div className="mt-4 rounded-2xl bg-forest p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/60">Emergency fund</p>
            <p className="mt-1 text-xl font-bold">Rp 7.2M</p>
          </div>
          <span className="font-serif text-4xl text-mint italic">72%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div data-grow="x" className="h-full w-[72%] rounded-full bg-mint" />
        </div>
        <p className="mt-2 text-[10px] text-white/60">Rp 2.8M left to reach your goal</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <OverviewStat label="Travel" value="38%" note="Rp 4.1M left" />
        <OverviewStat label="New laptop" value="61%" note="Rp 1.2M left" highlight />
      </div>
    </>
  ),
  budget: (
    <>
      <PreviewHeading eyebrow="Monthly plan" title="Smart budget" />
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-white/75 p-4">
        <div>
          <p className="text-[10px] text-sage">Remaining budget</p>
          <p className="mt-1 text-2xl font-bold text-ink">Rp 4.28M</p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-[7px] border-moss text-xs font-bold text-forest">
          68%
        </div>
      </div>
      <div className="mt-3 space-y-3 rounded-2xl bg-mist p-4">
        <BudgetRow label="Needs" value="Rp 1.4M / 2.5M" progress="56%" />
        <BudgetRow label="Lifestyle" value="Rp 740K / 1.5M" progress="49%" />
        <BudgetRow label="Savings" value="Rp 3.2M / 4.0M" progress="80%" color="bg-sage" />
      </div>
    </>
  ),
  subscriptions: (
    <>
      <PreviewHeading eyebrow="Recurring payments" title="Subscriptions" />
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-mist p-4">
        <div>
          <p className="text-[10px] text-sage">Monthly commitments</p>
          <p className="mt-1 text-2xl font-bold text-ink">Rp 560K</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-forest">3 active</span>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Netflix", "186K"],
          ["Spotify", "54K"],
          ["Figma", "320K"],
        ].map(([name, amount], index) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-line bg-white/75 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-xs text-mint">{name[0]}</div>
              <div>
                <p className="text-xs font-semibold text-ink">{name}</p>
                <p className="mt-0.5 text-[10px] text-sage">Due in {index + 2} days</p>
              </div>
            </div>
            <p className="text-xs font-bold text-forest">Rp {amount}</p>
          </div>
        ))}
      </div>
    </>
  ),
  debts: (
    <>
      <PreviewHeading eyebrow="Repayment progress" title="Debt tracker" />
      <div className="mt-4 rounded-2xl bg-forest p-4 text-white">
        <p className="text-[10px] text-white/60">Total remaining debt</p>
        <p className="mt-1 text-2xl font-bold">Rp 12.6M</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div data-grow="x" className="h-full w-[42%] rounded-full bg-mint" />
        </div>
        <p className="mt-2 text-[10px] text-white/60">42% paid off</p>
      </div>
      <div className="mt-3 space-y-2 rounded-2xl border border-line bg-white/75 p-4">
        <DebtRow name="Motorcycle loan" value="Rp 8.4M" progress="38%" />
        <DebtRow name="Credit card" value="Rp 4.2M" progress="58%" />
      </div>
    </>
  ),
  reports: (
    <>
      <PreviewHeading eyebrow="Insights" title="Monthly report" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <OverviewStat label="Spent this month" value="Rp 2.16M" note="-8% vs August" dark />
        <OverviewStat label="Top category" value="Food" note="32% of spending" highlight />
      </div>
      <div className="mt-3 rounded-2xl border border-line bg-white/70 p-4">
        <p className="text-[10px] font-semibold text-ink">Spending by category</p>
        <div className="mt-3 space-y-2.5">
          <BudgetRow label="Food" value="32%" progress="32%" />
          <BudgetRow label="Bills" value="21%" progress="21%" color="bg-sage" />
          <BudgetRow label="Transport" value="15%" progress="15%" color="bg-moss" />
        </div>
      </div>
    </>
  ),
};
