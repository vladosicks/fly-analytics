import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fly_access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const result = NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );

      if (response.status === 401) {
        result.cookies.set("fly_access_token", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }

      return result;
    }

    const user = await response.json();

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { detail: "Authentication service unavailable" },
      { status: 502 }
    );
  }
}
