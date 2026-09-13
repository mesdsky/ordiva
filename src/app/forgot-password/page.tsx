"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists with this email, a password reset link has been sent."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#F5F2E8] px-6 py-10 text-[#173C34]">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Ordiva Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/" aria-label="Ordiva Home">
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
                Forgot your password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#5F7168]">
                Enter your email and we'll send you a
                link to reset your password.
              </p>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="mt-6 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-2xl bg-[#E8EEDB] px-4 py-3 text-sm text-[#214F43]">
                {message}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition placeholder:text-[#A7B2AC] focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>
            </form>

            {/* Back */}
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