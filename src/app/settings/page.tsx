"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";
import PlanStatus from "@/components/PlanStatus";

export default function SettingsPage() {
  const router = useRouter();
  const { isDirty, setDirty } = useUnsavedChanges();
  const markDirty = () => setDirty(true);

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "dashboard" | "profile" | "logout" | null
  >(null);

  useEffect(() => {
    async function verifySession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      setPlan(profile?.plan === "premium" ? "premium" : "free");
      setLoading(false);
    }

    verifySession();
  }, [router]);

  function requestNavigation(
    action: "dashboard" | "profile" | "logout"
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

    if (action === "profile") {
      router.push("/profile");
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
    } else if (action === "profile") {
      router.push("/profile");
    } else if (action === "logout") {
      await handleLogout();
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setChangingPassword(false);
      return;
    }

    const supabase = createClient();
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      setError(passwordError.message || "Unable to change your password.");
      setChangingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Your password has been updated successfully.");
    setDirty(false);
    setChangingPassword(false);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    setDirty(false);
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2E8]">
        <p className="text-[#7B9685]">Loading your settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2E8] text-[#173C34]">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-12 md:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => requestNavigation("dashboard")}
              className="mb-4 text-sm font-semibold text-[#7B9685] transition hover:text-[#214F43]"
            >
              ← Back to Dashboard
            </button>

            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#7B9685]">
              Account control
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              Settings
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-[#5F7168]">
              Manage security and app preferences without changing your profile identity.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <PlanStatus plan={plan} />

            <button
              type="button"
              onClick={() => requestNavigation("logout")}
              disabled={loggingOut}
              className="w-fit rounded-2xl border border-[#DDE6D7] bg-white/70 px-5 py-3 text-sm font-semibold text-[#214F43] transition hover:bg-[#E8EEDB] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>

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

        <section className="mt-8 rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold">Profile preferences</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7B9685]">
            Your name, currency, account type, and financial goal are identity preferences managed from your Profile.
          </p>
          <button
            type="button"
            onClick={() => requestNavigation("profile")}
            className="mt-5 rounded-2xl border border-[#DDE6D7] bg-white px-5 py-3 text-sm font-semibold text-[#214F43] transition hover:bg-[#E8EEDB]"
          >
            Open Profile
          </button>
        </section>

        <section className="mt-6 rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm md:p-8">
          <div>
            <p className="text-sm font-semibold">Security</p>
            <p className="mt-1 text-sm text-[#7B9685]">
              Update your password to keep your account secure.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="text-sm font-semibold">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    markDirty();
                  }}
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="mt-2 w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#9AA9A0] focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-semibold">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    markDirty();
                  }}
                  placeholder="Repeat your new password"
                  minLength={6}
                  className="mt-2 w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3 text-sm text-[#173C34] outline-none transition placeholder:text-[#9AA9A0] focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-2xl border border-[#DDE6D7] bg-white px-6 py-3 text-sm font-semibold text-[#214F43] transition hover:bg-[#E8EEDB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-[#DDE6D7] bg-white/70 p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold">Billing &amp; plan</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7B9685]">
            Review your current plan and payment history from the billing area.
          </p>
          <Link
            href="/billing"
            className="mt-5 inline-flex rounded-2xl border border-[#DDE6D7] bg-white px-5 py-3 text-sm font-semibold text-[#214F43] transition hover:bg-[#E8EEDB]"
          >
            Open Billing
          </Link>
        </section>

        <section className="mt-6 rounded-3xl border border-[#DDE6D7] bg-white/55 p-6 md:p-8">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="mt-1 text-sm leading-6 text-[#7B9685]">
            Notification preferences will be added when Ordiva has notification delivery to manage. Nothing is enabled by default.
          </p>
        </section>

        <div className="pb-6 pt-8 text-center">
          <p className="text-xs text-[#7B9685]">Ordiva · Plan Smarter. Live Brighter.</p>
        </div>
      </div>

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
  );
}

