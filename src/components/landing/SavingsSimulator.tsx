"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Arrow } from "./icons";

const goals = [
  { label: "Emergency fund", amount: 10_000_000 },
  { label: "Vacation", amount: 5_000_000 },
  { label: "New laptop", amount: 15_000_000 },
  { label: "House deposit", amount: 50_000_000 },
];

const rupiah = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IDR",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value);

const compact = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`
    : `${Math.round(value / 1000)}K`;

function monthsToGoal(goal: number, monthlySaving: number) {
  if (monthlySaving <= 0) return Infinity;
  return Math.ceil(goal / monthlySaving);
}

export default function SavingsSimulator() {
  const [goalIndex, setGoalIndex] = useState(0);
  const [income, setIncome] = useState(6_000_000);
  const [rate, setRate] = useState(20);
  const [today] = useState(() => new Date());
  const incomeId = useId();
  const rateId = useId();

  const goal = goals[goalIndex].amount;
  const monthly = Math.round((income * rate) / 100);
  const months = monthsToGoal(goal, monthly);

  const finish = new Date(today);
  finish.setMonth(finish.getMonth() + (Number.isFinite(months) ? months : 0));
  const finishLabel = finish.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Chart: one bar per month (grouped past 24), height = saved so far.
  const bars = Math.min(Number.isFinite(months) ? months : 1, 24);
  const perBar = (Number.isFinite(months) ? months : 1) / bars;
  const heights = Array.from({ length: bars }, (_, i) =>
    Math.min((monthly * perBar * (i + 1)) / goal, 1) * 100
  );

  const split = [
    { label: "Needs", share: 50, color: "bg-forest" },
    { label: "Wants", share: 30, color: "bg-sage" },
    { label: "Savings", share: 20, color: "bg-moss" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      {/* Controls */}
      <div data-reveal="left" className="rounded-[1.75rem] border border-line bg-white/70 p-6 shadow-[0_20px_60px_rgba(23,60,52,0.06)] sm:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-sage uppercase">1. Pick your goal</p>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Savings goal">
          {goals.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="radio"
              aria-checked={goalIndex === index}
              onClick={() => setGoalIndex(index)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                goalIndex === index
                  ? "border-forest bg-forest text-white shadow-[0_8px_20px_rgba(33,79,67,0.25)]"
                  : "border-line bg-cream text-ink hover:border-mint hover:bg-mist"
              }`}
            >
              {item.label}
              <span className={`ml-2 text-xs ${goalIndex === index ? "text-mint" : "text-sage"}`}>
                {compact(item.amount)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-9">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={incomeId} className="text-xs font-semibold tracking-[0.2em] text-sage uppercase">
              2. Monthly income
            </label>
            <output htmlFor={incomeId} className="text-lg font-semibold text-ink tabular-nums">
              {rupiah(income)}
            </output>
          </div>
          <input
            id={incomeId}
            type="range"
            min={1_000_000}
            max={30_000_000}
            step={250_000}
            value={income}
            onChange={(event) => setIncome(Number(event.target.value))}
            className="range mt-4"
            style={{ ["--fill" as string]: `${((income - 1_000_000) / 29_000_000) * 100}%` }}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={rateId} className="text-xs font-semibold tracking-[0.2em] text-sage uppercase">
              3. You save
            </label>
            <output htmlFor={rateId} className="text-lg font-semibold text-ink tabular-nums">
              {rate}% <span className="text-sm font-normal text-sage">/ {rupiah(monthly)}</span>
            </output>
          </div>
          <input
            id={rateId}
            type="range"
            min={5}
            max={60}
            step={1}
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="range mt-4"
            style={{ ["--fill" as string]: `${((rate - 5) / 55) * 100}%` }}
          />
        </div>

        <div className="mt-9 rounded-2xl bg-mist p-4">
          <p className="text-xs font-semibold text-forest">The 50/30/20 guide for your income</p>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
            {split.map((part) => (
              <div key={part.label} className={part.color} style={{ width: `${part.share}%` }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            {split.map((part) => (
              <div key={part.label}>
                <p className="text-sage">
                  {part.label} {part.share}%
                </p>
                <p className="mt-0.5 font-semibold text-ink tabular-nums">
                  {compact((income * part.share) / 100)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      <div
        data-reveal="right"
        style={{ ["--d" as string]: "120ms" }}
        className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-forest p-6 text-white shadow-[0_30px_80px_rgba(33,79,67,0.3)] sm:p-8"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-moss/20 blur-3xl" />

        <p className="relative text-xs font-semibold tracking-[0.2em] text-mint/80 uppercase">
          {goals[goalIndex].label} reached in
        </p>
        <p aria-live="polite" className="relative mt-3 flex items-baseline gap-3">
          <span key={months} className="animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)] text-7xl font-semibold tracking-[-0.05em] tabular-nums sm:text-8xl">
            {Number.isFinite(months) ? months : "-"}
          </span>
          <span className="font-serif text-3xl text-mint italic">{months === 1 ? "month" : "months"}</span>
        </p>
        <p className="relative mt-2 text-sm text-white/65">
          Around <span className="font-semibold text-white">{finishLabel}</span>, saving{" "}
          <span className="font-semibold text-white">{rupiah(monthly)}</span> every month.
        </p>

        <div className="relative mt-8 flex-1">
          <div className="relative flex h-44 items-end gap-[3px] sm:h-52 sm:gap-1.5">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-mint/40" />
            {heights.map((height, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-md transition-[height,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  i === heights.length - 1 ? "bg-mint" : "bg-mint/25 hover:bg-mint/60"
                }`}
                style={{ height: `${Math.max(height, 2)}%`, transitionDelay: `${i * 18}ms` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/45">
            <span>Today</span>
            <span>Target {compact(goal)}</span>
          </div>
        </div>

        <Link
          href="/register"
          data-magnetic
          className="group relative mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-cream px-6 py-3.5 text-sm font-semibold text-forest shadow-[0_15px_40px_rgba(0,0,0,0.2)] transition-colors hover:bg-white"
        >
          Save this plan in Ordiva
          <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
