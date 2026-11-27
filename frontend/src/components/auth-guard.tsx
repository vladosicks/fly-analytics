"use client";

import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

function AuthGuardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute =
    pathname === "/login" || pathname === "/register";

  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {

    let cancelled = false;

    async function checkAuth() {
      setStatus("loading");

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (cancelled) return;

        if (response.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        setStatus("authenticated");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, isPublicRoute, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#333338] border-t-[#ff8a00]" />
          <p className="mt-4 text-sm text-[#92929a]">
            Verifying session...
          </p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] px-5 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">Unable to verify session</h1>
          <p className="mt-2 text-sm text-[#92929a]">
            The authentication service is temporarily unavailable.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-[#ff8a00] px-5 py-3 text-sm font-bold text-black"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}


export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d]">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#333338] border-t-[#ff8a00]" />
            <p className="mt-4 text-sm text-[#92929a]">
              Loading FLY Analytics...
            </p>
          </div>
        </main>
      }
    >
      <AuthGuardContent>{children}</AuthGuardContent>
    </Suspense>
  );
}
