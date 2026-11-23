"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to create account. Please check your details."
        );
        return;
      }

      router.replace("/login?registered=true");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] px-5 py-12 text-[#f5f5f5]">
      <div className="w-full max-w-[440px]">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff8a00] text-xl font-black text-black">
            F
          </div>
          <div>
            <div className="text-xl font-bold tracking-wide">
              FLY<span className="text-[#ff8a00]">.</span>ANALYTICS
            </div>
            <div className="text-[10px] tracking-[2px] text-[#77777f]">
              PERFORMANCE PLATFORM
            </div>
          </div>
        </Link>

        <div className="rounded-2xl border border-[#29292e] bg-[#151518] p-7 shadow-2xl sm:p-9">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#ff9b26]">
              Get started
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Create account<span className="text-[#ff8a00]">.</span>
            </h1>
            <p className="mt-2 text-sm text-[#92929a]">
              Start managing your campaigns with FLY Analytics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#c4c4ca]">
                Full name <span className="text-[#77777f]">(optional)</span>
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                maxLength={150}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-[#333338] bg-[#101012] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#66666e] focus:border-[#ff8a00]"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#c4c4ca]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#333338] bg-[#101012] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#66666e] focus:border-[#ff8a00]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#c4c4ca]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-[#333338] bg-[#101012] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#66666e] focus:border-[#ff8a00]"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#c4c4ca]">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-lg border border-[#333338] bg-[#101012] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#66666e] focus:border-[#ff8a00]"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#f87171]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#ff8a00] px-5 py-3.5 text-sm font-bold text-black transition hover:bg-[#ffa12e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-7 border-t border-[#29292e] pt-6 text-center text-sm text-[#92929a]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#ff9b26] transition hover:text-[#ffb45e]"
            >
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-[#66666e]">
          © 2026 FLY Analytics. All rights reserved.
        </p>
      </div>
    </main>
  );
}
