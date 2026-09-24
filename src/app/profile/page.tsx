"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";
import Navigation from "@/components/Navigation";
import PageHero, { heroButtonGhost } from "@/components/app/PageHero";
import PageLoader from "@/components/app/PageLoader";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";
import PlanStatus from "@/components/PlanStatus";

const currencies = [
  {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
];

const accountTypes = [
  {
    value: "personal",
    label: "Personal",
    description: "For managing your personal finances.",
  },
  {
    value: "organization",
    label: "Organization",
    description: "For clubs, committees, or organizations.",
  },
  {
    value: "business",
    label: "Business",
    description: "For managing business finances.",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { isDirty, setDirty } = useUnsavedChanges();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [accountType, setAccountType] =
    useState("personal");
  const [financialGoal, setFinancialGoal] =
    useState("");
  const [plan, setPlan] = useState<"free" | "premium">("free");


  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showUnsavedModal, setShowUnsavedModal] =
    useState(false);
  const [pendingAction, setPendingAction] =
    useState<"dashboard" | "logout" | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, currency, account_type, financial_goal, plan"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        setError(
          "Unable to load your profile."
        );
        setLoading(false);
        return;
      }

      setFullName(data?.full_name ?? "");
      setCurrency(data?.currency ?? "IDR");
      setAccountType(
        data?.account_type ?? "personal"
      );
      setFinancialGoal(
        data?.financial_goal ?? ""
      );
      setPlan(data?.plan === "premium" ? "premium" : "free");

      setDirty(false);
      setLoading(false);
    }

    loadProfile();
  }, [router, setDirty]);

  function markDirty() {
    setDirty(true);
    setMessage("");
    setError("");
  }

  function requestNavigation(
    action: "dashboard" | "logout"
  ) {
    if (isDirty) {
      setPendingAction(action);
      setShowUnsavedModal(true);
      return;
    }

    if (action === "dashboard") {
      router.push("/dashboard");
      return;
    }

    handleLogout();
  }

  function closeUnsavedModal() {
    if (loggingOut) return;

    setShowUnsavedModal(false);
    setPendingAction(null);
  }

  async function leaveWithoutSaving() {
    const action = pendingAction;

    setShowUnsavedModal(false);
    setPendingAction(null);
    setDirty(false);

    if (action === "dashboard") {
      router.push("/dashboard");
      return;
    }

    if (action === "logout") {
      await handleLogout();
    }
  }

  async function handleSaveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      setSaving(false);
      return;
    }

    const { error: updateError } =
      await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          currency,
          account_type: accountType,
          financial_goal:
            financialGoal.trim() || null,
        })
        .eq("id", user.id);

    if (updateError) {
      setError(
        "Unable to save your profile. Please try again."
      );
      setSaving(false);
      return;
    }

    setFullName(trimmedName);
    setMessage("Profile updated successfully.");
    setDirty(false);
    setSaving(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    setDirty(false);

    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <PageLoader label="Loading your profile..." />;
  }

  return (
    <>
    <Navigation />
    <main className="min-h-screen bg-[#F5F2E8] text-[#173C34]">
      <div className="app-enter mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-12">
        {/* =========================
            HEADER
        ========================= */}

        <PageHero
          eyebrow="Account"
          title="Your"
          accent="profile."
          description="Manage your personal information."
          actions={
            <>
              <PlanStatus plan={plan} className="border-white/25 bg-white/10 text-white" />
              <button
                type="button"
                onClick={() => requestNavigation("logout")}
                disabled={loggingOut}
                className={heroButtonGhost}
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </>
          }
        />

        {/* =========================
            STATUS MESSAGE
        ========================= */}

        {(message || error) && (
          <div
            className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#DDE6D7] bg-[#E8EEDB] text-[#214F43]"
            }`}
          >
            {error || message}
          </div>
        )}

        {/* =========================
            PROFILE INFORMATION
        ========================= */}

        <form
          onSubmit={handleSaveProfile}
          className="mt-8 space-y-6"
        >
          <section className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm md:p-8">
            <div>
              <p className="text-sm font-semibold">
                Personal Information
              </p>

              <p className="mt-1 text-sm text-[#7B9685]">
                Keep your account information up to
                date.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-semibold"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    markDirty();
                  }}
                  placeholder="Your full name"
                  className="mt-2 w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#9AA9A0] hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[#DDE6D7] bg-[#EDEDE7] px-4 py-3 text-sm text-[#7B9685]"
                />

                <p className="mt-2 text-xs text-[#7B9685]">
                  Your email is managed by your
                  authentication account.
                </p>
              </div>
            </div>
          </section>

          {/* =========================
              PREFERENCES
          ========================= */}

          <section className="app-card rounded-[1.75rem] border border-[#DDE6D7] bg-white/70 p-6 shadow-sm md:p-8">
            <div>
              <p className="text-sm font-semibold">
                Preferences
              </p>

              <p className="mt-1 text-sm text-[#7B9685]">
                Customize how Ordiva works for you.
              </p>
            </div>

            <div className="mt-6 space-y-7">
              {/* Currency */}
              <div>
                <label
                  htmlFor="currency"
                  className="text-sm font-semibold"
                >
                  Display Currency
                </label>

                <p className="mt-1 text-xs text-[#7B9685]">
                  Choose the currency used to display
                  your financial data.
                </p>

                <select
                  id="currency"
                  value={currency}
                  onChange={(event) => {
                    setCurrency(event.target.value);
                    markDirty();
                  }}
                  className="mt-3 w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3 text-sm text-[#173C34] outline-none transition hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                >
                  {currencies.map((item) => (
                    <option
                      key={item.code}
                      value={item.code}
                    >
                      {item.symbol} {item.code} ·{" "}
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Type */}
              <div>
                <p className="text-sm font-semibold">
                  Account Type
                </p>

                <p className="mt-1 text-xs text-[#7B9685]">
                  Choose the type of finances you are
                  managing.
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {accountTypes.map((item) => {
                    const selected =
                      accountType === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setAccountType(
                            item.value
                          );
                          markDirty();
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-[#214F43] bg-[#E8EEDB] shadow-sm"
                            : "border-[#DDE6D7] bg-[#F9F8F2] hover:bg-[#E8EEDB]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">
                            {item.label}
                          </p>

                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#214F43] bg-[#214F43]"
                                : "border-[#B8C7BD]"
                            }`}
                          >
                            {selected && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-[#7B9685]">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Financial Goal */}
              <div>
                <label
                  htmlFor="financialGoal"
                  className="text-sm font-semibold"
                >
                  Financial Goal
                </label>

                <p className="mt-1 text-xs text-[#7B9685]">
                  What are you mainly trying to achieve
                  financially?
                </p>

                <input
                  id="financialGoal"
                  type="text"
                  value={financialGoal}
                  onChange={(event) => {
                    setFinancialGoal(
                      event.target.value
                    );
                    markDirty();
                  }}
                  placeholder="e.g. Build an emergency fund"
                  className="mt-3 w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#9AA9A0] hover:border-[#C8D8BE] focus:border-[#214F43] focus:bg-white focus:ring-4 focus:ring-[#214F43]/10"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#214F43] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </section>
        </form>

        {/* =========================
            FOOTER NOTE
        ========================= */}

        <div className="pb-6 pt-8 text-center">
          <p className="text-xs text-[#7B9685]">
            Ordiva · Plan Smarter. Live Brighter.
          </p>
        </div>
      </div>

      {/* =========================
          UNSAVED CHANGES MODAL
      ========================= */}

      <ConfirmModal
        open={showUnsavedModal}
        title="Leave this page?"
        description="You still have unsaved changes. If you leave now, those changes will be lost."
        confirmLabel="Leave without saving"
        cancelLabel="Stay on page"
        onConfirm={leaveWithoutSaving}
        onCancel={closeUnsavedModal}
        loading={loggingOut}
      />
    </main>
    </>
  );
}