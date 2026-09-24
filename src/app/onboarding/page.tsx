"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const steps = [
  {
    number: 1,
    label: "Welcome",
  },
  {
    number: 2,
    label: "Profile",
  },
  {
    number: 3,
    label: "Goal",
  },
  {
    number: 4,
    label: "Currency",
  },
];

const accountTypes = [
  {
    value: "personal",
    title: "Personal",
    description: "Manage your everyday finances",
    icon: "◎",
  },
  {
    value: "organization",
    title: "Organization",
    description: "Manage a team or organization",
    icon: "◇",
  },
  {
    value: "business",
    title: "Business",
    description: "Manage your business finances",
    icon: "▣",
  },
];

const financialGoals = [
  {
    value: "track_expenses",
    title: "Track my expenses",
    description: "Understand where my money goes",
    icon: "↗",
  },
  {
    value: "save_money",
    title: "Save more money",
    description: "Build better saving habits",
    icon: "◈",
  },
  {
    value: "control_budget",
    title: "Control my budget",
    description: "Stay on top of my spending",
    icon: "▤",
  },
  {
    value: "pay_debt",
    title: "Pay off debt",
    description: "Take control of my obligations",
    icon: "↓",
  },
  {
    value: "build_wealth",
    title: "Build long-term wealth",
    description: "Work toward bigger financial goals",
    icon: "↗",
  },
];

const currencies = [
  {
    value: "IDR",
    symbol: "Rp",
    title: "Indonesian Rupiah",
    description: "Indonesia",
  },
  {
    value: "USD",
    symbol: "$",
    title: "US Dollar",
    description: "United States",
  },
  {
    value: "SGD",
    symbol: "S$",
    title: "Singapore Dollar",
    description: "Singapore",
  },
  {
    value: "MYR",
    symbol: "RM",
    title: "Malaysian Ringgit",
    description: "Malaysia",
  },
  {
    value: "EUR",
    symbol: "€",
    title: "Euro",
    description: "European Union",
  },
  {
    value: "GBP",
    symbol: "£",
    title: "British Pound",
    description: "United Kingdom",
  },
  {
    value: "JPY",
    symbol: "¥",
    title: "Japanese Yen",
    description: "Japan",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState("personal");
  const [currency, setCurrency] = useState("IDR");
  const [financialGoal, setFinancialGoal] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, account_type, currency, financial_goal")
        .eq("id", user.id)
        .single();

      if (error) {
        setMessage("We couldn't load your profile. Please try again.");
        setLoading(false);
        return;
      }

      setFullName(
        profile?.full_name ||
          user.user_metadata?.full_name ||
          ""
      );

      setAccountType(
        profile?.account_type || "personal"
      );

      setCurrency(
        profile?.currency || "IDR"
      );

      setFinancialGoal(
        profile?.financial_goal || ""
      );

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function handleNext() {
    setMessage("");

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!fullName.trim()) {
        setMessage("Please enter your name first.");
        return;
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      if (!financialGoal) {
        setMessage("Please choose your main financial goal.");
        return;
      }

      setStep(4);
      return;
    }

    if (step === 4) {
      handleSubmit();
    }
  }

  function handleBack() {
    setMessage("");

    if (step > 1) {
      setStep((current) => current - 1);
    }
  }

  async function handleSubmit(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    if (!fullName.trim()) {
      setStep(2);
      setMessage("Please enter your name first.");
      return;
    }

    if (!financialGoal) {
      setStep(3);
      setMessage("Please choose your main financial goal.");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        account_type: accountType,
        currency,
        financial_goal: financialGoal,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2E8] text-[#173C34]">
        <div className="text-center">
          <img
            src="/ordiva-navbar.png"
            alt="Ordiva"
            className="mx-auto h-11 w-auto object-contain"
          />

          <p className="mt-6 text-sm text-[#7B9685]">
            Preparing your financial space...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2E8] px-5 py-8 text-[#173C34] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full">
          {/* =====================================================
              HEADER
          ===================================================== */}
          <div className="mb-8 text-center sm:mb-10">
            <img
              src="/ordiva-navbar.png"
              alt="Ordiva"
              className="mx-auto h-11 w-auto object-contain"
            />

            <div className="mt-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7B9685]">
                Set up your Ordiva
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Let&apos;s make it yours.
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#5F7168] sm:text-base">
                A few quick details will help us personalize
                your financial space.
              </p>
            </div>
          </div>

          {/* =====================================================
              PROGRESS
          ===================================================== */}
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between">
              {steps.map((item, index) => {
                const active = step >= item.number;

                return (
                  <div
                    key={item.number}
                    className="flex flex-1 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                          active
                            ? "bg-[#214F43] text-white shadow-[0_6px_18px_rgba(33,79,67,0.14)]"
                            : "border border-[#DDE6D7] bg-white/60 text-[#9AAA9F]"
                        }`}
                      >
                        {item.number}
                      </div>

                      <span
                        className={`hidden text-[11px] font-semibold sm:block ${
                          active
                            ? "text-[#214F43]"
                            : "text-[#9AAA9F]"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`mx-3 h-px flex-1 transition-colors duration-300 ${
                          step > item.number
                            ? "bg-[#7B9685]"
                            : "bg-[#DDE6D7]"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* =====================================================
              MAIN CARD
          ===================================================== */}
          <div className="rounded-[2rem] border border-[#DDE6D7] bg-white/65 p-5 shadow-[0_20px_60px_rgba(23,60,52,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl sm:p-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleNext();
              }}
            >
              {/* =================================================
                  STEP 1 · WELCOME
              ================================================= */}
              {step === 1 && (
                <div className="min-h-[390px] animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex min-h-[390px] flex-col justify-center text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-[#E8EEDB] text-3xl text-[#214F43] shadow-sm">
                      ◇
                    </div>

                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#7B9685]">
                      Welcome to Ordiva
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                      Your money,
                      <br />
                      your way.
                    </h2>

                    <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#5F7168] sm:text-base">
                      We&apos;ll ask you a few simple questions
                      to create a financial space that fits
                      the way you manage money.
                    </p>

                    <div className="mx-auto mt-7 flex flex-wrap justify-center gap-2">
                      <Pill text="Simple" />
                      <Pill text="Personalized" />
                      <Pill text="All-in-one" />
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  STEP 2 · PROFILE
              ================================================= */}
              {step === 2 && (
                <div className="min-h-[390px] animate-[fadeIn_0.3s_ease-out]">
                  <StepHeading
                    eyebrow="01 / 03"
                    title="First, tell us about you."
                    description="This helps us personalize your Ordiva experience."
                  />

                  <div className="mt-8 space-y-7">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2.5 block text-sm font-semibold"
                      >
                        What should we call you?
                      </label>

                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        placeholder="Your name"
                        autoFocus
                        className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-4 text-base outline-none transition placeholder:text-[#A4B1AA] hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                      />
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-semibold">
                        What are you managing?
                      </p>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {accountTypes.map((item) => {
                          const selected =
                            accountType === item.value;

                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() =>
                                setAccountType(item.value)
                              }
                              className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
                                selected
                                  ? "border-[#214F43] bg-[#E8EEDB] shadow-[0_8px_24px_rgba(33,79,67,0.06)]"
                                  : "border-[#DDE6D7] bg-[#F9F8F2] hover:-translate-y-0.5 hover:border-[#BFD0C3] hover:bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <span
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm ${
                                    selected
                                      ? "bg-[#214F43] text-white"
                                      : "bg-[#E8EEDB] text-[#214F43]"
                                  }`}
                                >
                                  {item.icon}
                                </span>

                                {selected && (
                                  <span className="text-xs font-bold text-[#214F43]">
                                    ✓
                                  </span>
                                )}
                              </div>

                              <p className="mt-4 text-sm font-semibold">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#7B9685]">
                                {item.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  STEP 3 · GOAL
              ================================================= */}
              {step === 3 && (
                <div className="min-h-[390px] animate-[fadeIn_0.3s_ease-out]">
                  <StepHeading
                    eyebrow="02 / 03"
                    title="What do you want to improve?"
                    description="Choose the goal that matters most to you right now."
                  />

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {financialGoals.map((item) => {
                      const selected =
                        financialGoal === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setFinancialGoal(item.value)
                          }
                          className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                            selected
                              ? "border-[#214F43] bg-[#E8EEDB] shadow-[0_8px_24px_rgba(33,79,67,0.06)]"
                              : "border-[#DDE6D7] bg-[#F9F8F2] hover:-translate-y-0.5 hover:border-[#BFD0C3] hover:bg-white"
                          }`}
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm ${
                              selected
                                ? "bg-[#214F43] text-white"
                                : "bg-[#E8EEDB] text-[#214F43]"
                            }`}
                          >
                            {item.icon}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                              {item.title}
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-[#7B9685]">
                              {item.description}
                            </span>
                          </span>

                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                              selected
                                ? "border-[#214F43] bg-[#214F43] text-white"
                                : "border-[#C8D5CC] text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =================================================
                  STEP 4 · CURRENCY
              ================================================= */}
              {step === 4 && (
                <div className="min-h-[390px] animate-[fadeIn_0.3s_ease-out]">
                  <StepHeading
                    eyebrow="03 / 03"
                    title="Choose your main currency."
                    description="This will be used across your Ordiva financial data."
                  />

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {currencies.map((item) => {
                      const selected =
                        currency === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setCurrency(item.value)
                          }
                          className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                            selected
                              ? "border-[#214F43] bg-[#E8EEDB] shadow-[0_8px_24px_rgba(33,79,67,0.06)]"
                              : "border-[#DDE6D7] bg-[#F9F8F2] hover:-translate-y-0.5 hover:border-[#BFD0C3] hover:bg-white"
                          }`}
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              selected
                                ? "bg-[#214F43] text-white"
                                : "bg-white text-[#214F43]"
                            }`}
                          >
                            {item.symbol}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">
                              {item.value}
                            </span>

                            <span className="mt-1 block truncate text-xs text-[#7B9685]">
                              {item.title} · {item.description}
                            </span>
                          </span>

                          {selected && (
                            <span className="text-xs font-bold text-[#214F43]">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =================================================
                  ERROR
              ================================================= */}
              {message && (
                <div className="mt-5 rounded-2xl border border-[#E8D7D7] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A4D43]">
                  {message}
                </div>
              )}

              {/* =================================================
                  FOOTER ACTIONS
              ================================================= */}
              <div className="mt-8 flex items-center justify-between border-t border-[#DDE6D7] pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || saving}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    step === 1
                      ? "pointer-events-none opacity-0"
                      : "text-[#7B9685] hover:bg-[#E8EEDB] hover:text-[#214F43]"
                  }`}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="group rounded-full bg-[#214F43] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(33,79,67,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    {saving
                      ? "Setting up..."
                      : step === 4
                      ? "Finish setup"
                      : step === 1
                      ? "Let’s begin"
                      : "Continue"}

                    {!saving && (
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <p className="mt-5 text-center text-[11px] text-[#8B9A92]">
            You can change these preferences later from your profile.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StepHeading({
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B9685]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-[#5F7168]">
        {description}
      </p>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-[#DDE6D7] bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#5F7168]">
      {text}
    </span>
  );
}