"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to sign in. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
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
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Sign in<span className="text-[#ff8a00]">.</span>
            </h1>
            <p className="mt-2 text-sm text-[#92929a]">
              Access your campaigns and performance data.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#c4c4ca]"
              >
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
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#c4c4ca]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-7 border-t border-[#29292e] pt-6 text-center text-sm text-[#92929a]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#ff9b26] transition hover:text-[#ffb45e]"
            >
              Create account
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
