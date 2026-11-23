"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load user");
        }

        const data = await response.json();

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const displayName = user?.full_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="max-w-[180px] truncate text-sm font-medium text-white">
          {loading ? "Loading..." : displayName}
        </p>
        <p className="max-w-[180px] truncate text-xs text-[#77777f]">
          {user?.email || ""}
        </p>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ff8a00]/30 bg-[#ff8a00]/10 text-sm font-semibold text-[#ff9b26]">
        {loading ? "..." : initial}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut || loading || !user}
        className="rounded-lg border border-[#333338] bg-[#19191c] px-3 py-2 text-xs font-medium text-[#c4c4ca] transition hover:border-[#ff8a00]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loggingOut ? "Signing out..." : "Logout"}
      </button>
    </div>
  );
}
