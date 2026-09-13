"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessage("Unable to sign you in. Please try again.");
      setLoading(false);
      return;
    }

    /*
     * Check whether the user's profile has completed
     * the onboarding setup.
     */
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "full_name, account_type, currency, financial_goal"
        )
        .eq("id", data.user.id)
        .single();

    if (profileError) {
      /*
       * The auth session is already valid, but if the profile
       * cannot be read, do not guess the onboarding state.
       */
      setMessage(
        "We couldn't load your profile. Please try again."
      );
      setLoading(false);
      return;
    }

    /*
     * A profile is considered complete when all onboarding
     * fields contain valid values.
     */
    const profileComplete =
      Boolean(profile?.full_name?.trim()) &&
      Boolean(profile?.account_type) &&
      Boolean(profile?.currency) &&
      Boolean(profile?.financial_goal);

    if (profileComplete) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#F5F2E8] px-6 py-12 text-[#173C34]">
      <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Logo */}
          <div className="mb-10 text-center">
            <Link href="/">
              <img
                src="/ordiva-navbar.png"
                alt="Ordiva"
                className="mx-auto h-12 w-auto object-contain"
              />
            </Link>

            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-3 text-[#5F7168]">
              Log in to continue managing your finances.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-8 shadow-sm">
            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              {/* Email */}
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
                  className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#7B9685] transition hover:text-[#214F43]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>

              {/* Error */}
              {message && (
                <div className="rounded-2xl border border-[#E8D7D7] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A4D43]">
                  {message}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Checking your account..."
                  : "Log in"}
              </button>
            </form>

            {/* Register */}
            <p className="mt-6 text-center text-sm text-[#5F7168]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#214F43] hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Back */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[#7B9685] transition hover:text-[#214F43]"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}