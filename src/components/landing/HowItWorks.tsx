"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "./icons";

const steps = [
  {
    title: "Create your account",
    description: "Sign up and tailor your financial profile to how you live.",
  },
  {
    title: "Track your money",
    description: "Log income and expenses to understand where your money goes.",
  },
  {
    title: "Make progress",
    description:
      "Use insights, budgets, and goals to build better money habits.",
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.step));
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative mt-16 grid gap-12 lg:mt-24 lg:grid-cols-2 lg:gap-20">
      {/* Steps */}
      <div className="relative min-w-0">
        <div className="absolute top-2 bottom-2 left-[27px] hidden w-px bg-white/15 lg:block">
          <div
            className="w-full bg-mint transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ height: `${(active / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => (
          <div
            key={step.title}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
            data-step={index}
            className="relative py-6 lg:flex lg:min-h-[70vh] lg:items-center lg:py-0"
          >
            <div data-reveal className="flex items-start gap-5 sm:gap-6 lg:items-center">
              <div
                className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border font-mono text-sm transition-all duration-500 ${
                  active >= index
                    ? "border-white/40 bg-cream text-forest shadow-[0_0_0_8px_rgba(200,216,190,0.12)]"
                    : "border-white/20 bg-deep text-white/60"
                }`}
              >
                {active > index ? <Check /> : `0${index + 1}`}
              </div>
              <div
                className={`min-w-0 transition-all duration-700 lg:max-w-md ${
                  active === index ? "lg:opacity-100" : "lg:opacity-35"
                }`}
              >
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                  {step.description}
                </p>
              </div>
            </div>
            {/* Mobile: full-width preview under the step, not squeezed beside the number. */}
            <div data-reveal="scale" className="mt-6 lg:hidden">
              <StepVisual index={index} active />
            </div>
          </div>
        ))}
      </div>

      {/* Sticky visual */}
      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-15rem)] h-[30rem]">
          {steps.map((step, index) => (
            <div
              key={step.title}
              aria-hidden={active !== index}
              className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                active === index
                  ? "translate-y-0 scale-100 opacity-100"
                  : active > index
                  ? "-translate-y-8 scale-95 opacity-0"
                  : "translate-y-8 scale-95 opacity-0"
              }`}
            >
              <StepVisual index={index} active={active === index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-white/15 bg-white/[0.07] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <div className="flex-1 overflow-hidden rounded-[1.6rem] bg-cream p-6">{children}</div>
    </div>
  );
}

function StepVisual({ index, active }: { index: number; active: boolean }) {
  if (index === 0) {
    return (
      <Frame>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">Welcome to Ordiva</p>
        <p className="mt-1 text-xl font-semibold text-ink">Set up your profile</p>
        <div className="mt-6 space-y-3">
          {[
            ["Full name", "Rani Putri"],
            ["Account type", "Personal"],
            ["Currency", "IDR · Indonesian Rupiah"],
          ].map(([label, value], i) => (
            <div
              key={label}
              className="rounded-xl border border-line bg-white px-4 py-3 transition-all duration-700"
              style={{ transitionDelay: active ? `${i * 120 + 150}ms` : "0ms", opacity: active ? 1 : 0, translate: active ? "0 0" : "0 10px" }}
            >
              <p className="text-[10px] text-sage">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
            </div>
          ))}
          <div className="rounded-xl border border-forest bg-mist px-4 py-3">
            <p className="text-[10px] text-sage">Main financial goal</p>
            <p className="mt-0.5 text-sm font-medium text-ink">Build an emergency fund</p>
          </div>
        </div>
      </Frame>
    );
  }

  if (index === 1) {
    const rows = [
      ["Salary", "Income", "+ Rp 5,400,000", true],
      ["Groceries", "Food", "- Rp 420,000", false],
      ["Bus pass", "Transport", "- Rp 150,000", false],
      ["Electricity", "Bills", "- Rp 380,000", false],
    ] as const;
    return (
      <Frame>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">September</p>
            <p className="mt-1 text-xl font-semibold text-ink">Transactions</p>
          </div>
          <span className="rounded-full bg-forest px-3 py-1.5 text-[11px] font-semibold text-white">+ Add</span>
        </div>
        <div className="mt-6 space-y-2.5">
          {rows.map(([name, category, amount, income], i) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 transition-all duration-700"
              style={{ transitionDelay: active ? `${i * 110 + 150}ms` : "0ms", opacity: active ? 1 : 0, translate: active ? "0 0" : "24px 0" }}
            >
              <div className="flex items-center gap-3">
                <span className={`h-8 w-8 rounded-lg ${income ? "bg-forest" : "bg-mist"}`} />
                <div>
                  <p className="text-sm font-medium text-ink">{name}</p>
                  <p className="text-[10px] text-sage">{category}</p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${income ? "text-forest" : "text-slate"}`}>{amount}</p>
            </div>
          ))}
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <p className="text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">Your progress</p>
      <p className="mt-1 text-xl font-semibold text-ink">Emergency fund</p>
      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#E8EEDB" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#214F43"
              strokeWidth="12"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="100"
              strokeDashoffset={active ? 28 : 100}
              className="transition-[stroke-dashoffset] delay-200 duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-ink">72%</span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-ink">Rp 7.2M</p>
          <p className="text-sm text-sage">of Rp 10M</p>
          <p className="mt-3 inline-flex rounded-full bg-mist px-3 py-1 text-xs font-semibold text-forest">
            On track for December
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-forest p-4 text-white">
        <p className="text-xs text-white/60">This month you saved</p>
        <p className="mt-1 text-lg font-semibold">Rp 3,240,000 · 60% of income</p>
      </div>
    </Frame>
  );
}
