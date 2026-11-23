import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    if (!data.access_token || !data.user) {
      return NextResponse.json(
        { detail: "Invalid authentication response" },
        { status: 502 }
      );
    }

    const result = NextResponse.json({
      user: data.user,
    });

    result.cookies.set("fly_access_token", data.access_token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60,
    });

    return result;
  } catch {
    return NextResponse.json(
      { detail: "Authentication service unavailable" },
      { status: 502 }
    );
  }
}
