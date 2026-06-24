import { NextResponse } from "next/server";

// Logout is handled by NextAuth at /api/auth/signout
// This route is kept for backward compatibility
export async function POST() {
  return NextResponse.json({ ok: true });
}
