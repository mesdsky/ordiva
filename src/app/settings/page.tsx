"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  account_type: "personal" | "organization" | "business" | null;
  currency: string | null;
  financial_goal: string | null;
};

const ACCOUNT_TYPES = [
  {
    value: "personal",
    label: "Personal",
    description: "Manage your personal finances",
    icon: "👤",
  },
  {
    value: "organization",
    label: "Organization",
    description: "Manage finances for an organization",
    icon: "🏢",
  },
  {
    value: "business",
    label: "Business",
    description: "Manage business finances",
    icon: "💼",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<
    "personal" | "organization" | "business"
  >("personal");
  const [currency, setCurrency] = useState("IDR");
  const [financialGoal, setFinancialGoal] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, account_type, currency, financial_goal")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      setProfileError("Failed to load your profile.");
      setLoading(false);
      return;
    }

    if (data) {
      const profileData = data as Profile;

      setProfile(profileData);
      setFullName(profileData.full_name ?? "");
      setAccountType(profileData.account_type ?? "personal");
      setCurrency(profileData.currency ?? "IDR");
      setFinancialGoal(profileData.financial_goal ?? "");
    }

    setLoading(false);
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        account_type: accountType,
        currency,
        financial_goal: financialGoal.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, full_name, account_type, currency, financial_goal")
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      setProfileError(error.message || "Failed to save your profile.");
      setSavingProfile(false);
      return;
    }

    setProfile(data as Profile);
    setProfileMessage("Profile updated successfully.");
    setSavingProfile(false);
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setChangingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      setChangingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Failed to change password.");
      setChangingPassword(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password changed successfully.");
    setChangingPassword(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2E8] text-[#173C34]">
        <Navigation />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 rounded-xl bg-[#DDE6D7]" />

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="h-[520px] rounded-3xl bg-white" />
              <div className="h-[520px] rounded-3xl bg-white" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2E8] text-[#173C34]">
      <Navigation />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-[#7B9685]">
            Your account
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#173C34] sm:text-4xl">
            Profile & Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7D73] sm:text-base">
            Manage your personal information and financial preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Profile card */}
            <section className="rounded-3xl border border-[#DDE6D7] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E8EEDB] text-2xl">
                  {fullName
                    ? fullName.charAt(0).toUpperCase()
                    : "U"}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#173C34]">
                    Profile Information
                  </h2>

                  <p className="mt-1 text-sm text-[#7B9685]">
                    Keep your account information up to date.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-[#173C34]"
                  >
                    Full name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#FAFBF6] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#A0ADA5] focus:border-[#7B9685] focus:ring-2 focus:ring-[#AFC1A4]/30"
                  />
                </div>

                {/* Account type */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-[#173C34]">
                    Account type
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {ACCOUNT_TYPES.map((type) => {
                      const selected = accountType === type.value;

                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setAccountType(
                              type.value as
                                | "personal"
                                | "organization"
                                | "business"
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-[#7B9685] bg-[#E8EEDB] shadow-sm"
                              : "border-[#DDE6D7] bg-[#FAFBF6] hover:border-[#AFC1A4] hover:bg-[#F5F7EF]"
                          }`}
                        >
                          <div className="mb-3 text-xl">{type.icon}</div>

                          <p className="text-sm font-bold text-[#173C34]">
                            {type.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#7B9685]">
                            {type.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label
                    htmlFor="currency"
                    className="mb-2 block text-sm font-semibold text-[#173C34]"
                  >
                    Currency
                  </label>

                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-[#DDE6D7] bg-[#FAFBF6] px-4 py-3 text-sm font-medium text-[#173C34] outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#AFC1A4]/30"
                  >
                    <option value="IDR">IDR — Indonesian Rupiah</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="SGD">SGD — Singapore Dollar</option>
                    <option value="MYR">MYR — Malaysian Ringgit</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="JPY">JPY — Japanese Yen</option>
                  </select>
                </div>

                {/* Financial goal */}
                <div>
                  <label
                    htmlFor="financialGoal"
                    className="mb-2 block text-sm font-semibold text-[#173C34]"
                  >
                    Financial goal
                  </label>

                  <textarea
                    id="financialGoal"
                    value={financialGoal}
                    onChange={(e) => setFinancialGoal(e.target.value)}
                    placeholder="e.g. Build an emergency fund, save for a laptop..."
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-[#DDE6D7] bg-[#FAFBF6] px-4 py-3 text-sm leading-6 text-[#173C34] outline-none transition placeholder:text-[#A0ADA5] focus:border-[#7B9685] focus:ring-2 focus:ring-[#AFC1A4]/30"
                  />
                </div>

                {profileMessage && (
                  <div className="rounded-2xl border border-[#C9DCC5] bg-[#EEF5E9] px-4 py-3 text-sm font-medium text-[#3F6955]">
                    {profileMessage}
                  </div>
                )}

                {profileError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {profileError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? "Saving changes..." : "Save changes"}
                </button>
              </form>
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Account overview */}
            <section className="rounded-3xl border border-[#DDE6D7] bg-[#214F43] p-6 text-white shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#C7D8C5]">
                    Account
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    {fullName || "Your Ordiva account"}
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  {fullName
                    ? fullName.charAt(0).toUpperCase()
                    : "U"}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sm text-[#D6E2D5]">
                    Account type
                  </span>

                  <span className="text-sm font-semibold capitalize">
                    {accountType}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sm text-[#D6E2D5]">
                    Currency
                  </span>

                  <span className="text-sm font-semibold">
                    {currency}
                  </span>
                </div>
              </div>
            </section>

            {/* Password */}
            <section className="rounded-3xl border border-[#DDE6D7] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#173C34]">
                  Security
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#7B9685]">
                  Update your password to keep your account secure.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#173C34]"
                  >
                    New password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#FAFBF6] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#A0ADA5] focus:border-[#7B9685] focus:ring-2 focus:ring-[#AFC1A4]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-[#173C34]"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#FAFBF6] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#A0ADA5] focus:border-[#7B9685] focus:ring-2 focus:ring-[#AFC1A4]/30"
                  />
                </div>

                {passwordMessage && (
                  <div className="rounded-2xl border border-[#C9DCC5] bg-[#EEF5E9] px-4 py-3 text-sm font-medium text-[#3F6955]">
                    {passwordMessage}
                  </div>
                )}

                {passwordError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {passwordError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full rounded-2xl border border-[#AFC1A4] bg-[#F5F7EF] px-5 py-3.5 text-sm font-semibold text-[#214F43] transition hover:bg-[#E8EEDB] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword
                    ? "Updating password..."
                    : "Change password"}
                </button>
              </form>
            </section>

            {/* Danger zone */}
            <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#173C34]">
                  Account actions
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#7B9685]">
                  Sign out from your current Ordiva session.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>↪</span>
                {loggingOut ? "Signing out..." : "Log out"}
              </button>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pb-4 text-center">
          <p className="text-xs text-[#9AA79F]">
            Ordiva · Plan Smarter. Live Brighter.
          </p>
        </div>
      </main>
    </div>
  );
}