"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage(
          "This password reset link is invalid or has expired. Please request a new one."
        );
        setLoading(false);
        return;
      }

      setReady(true);
      setLoading(false);
    }

    checkSession();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(
      "Your password has been updated successfully."
    );

    setSaving(false);

    setTimeout(() => {
      router.push("/login");
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-[#F5F2E8] px-6 py-10 text-[#173C34]">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Ordiva Logo */}
          <div className="mb-8 flex justify-center">
            <Link
              href="/"
              aria-label="Ordiva Home"
            >
              <Image
                src="/ordiva-navbar.png"
                alt="Ordiva"
                width={150}
                height={50}
                priority
                className="h-auto w-[150px] object-contain"
              />
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-[#DDE6D7] bg-white/80 p-7 shadow-sm sm:p-8">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#7B9685]">
                Account Recovery
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Create a new password
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#5F7168]">
                Choose a new password for your Ordiva
                account.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="mt-7 rounded-2xl bg-[#E8EEDB] px-4 py-4 text-center text-sm text-[#214F43]">
                Verifying your reset link...
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="mt-6 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="mt-6 rounded-2xl bg-[#E8EEDB] px-4 py-3 text-sm text-[#214F43]">
                {message}
              </div>
            )}

            {/* Form */}
            {ready && !message && (
              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >
                {/* New Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold"
                  >
                    New password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition placeholder:text-[#A7B2AC] focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />

                  <p className="mt-2 text-xs text-[#7B9685]">
                    Minimum 6 characters.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Confirm new password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter your new password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition placeholder:text-[#A7B2AC] focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-[#214F43] transition hover:text-[#173C34]"
              >
                ← Back to Login
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#7B9685]">
            Plan Smarter. Live Brighter.
          </p>
        </div>
      </div>
    </main>
  );
}