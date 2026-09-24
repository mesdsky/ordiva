"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setMessage(
        "Account created! Check your email to verify your address."
      );
    }

    setLoading(false);
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
              Create your account
            </h1>

            <p className="mt-3 text-[#5F7168]">
              Start managing your finances with Ordiva.
            </p>
          </div>

          {/* Register Card */}
          <div className="rounded-3xl border border-[#DDE6D7] bg-white/70 p-8 shadow-sm">
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>

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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  minLength={6}
                  required
                  className="w-full rounded-2xl border border-[#DDE6D7] bg-[#F9F8F2] px-4 py-3.5 outline-none transition focus:border-[#7B9685] focus:ring-2 focus:ring-[#DDE6D7]"
                />

                <p className="mt-2 text-xs text-[#7B9685]">
                  Minimum 6 characters.
                </p>
              </div>

              {/* Message */}
              {message && (
                <div className="rounded-2xl bg-[#E8EEDB] px-4 py-3 text-sm text-[#214F43]">
                  {message}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#214F43] px-5 py-3.5 font-semibold text-white transition hover:bg-[#173C34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            {/* Login */}
            <p className="mt-6 text-center text-sm text-[#5F7168]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#214F43] hover:underline"
              >
                Log in
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