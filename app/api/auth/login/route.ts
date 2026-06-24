import { NextResponse } from "next/server";

// Login is now handled by NextAuth at /api/auth/[...nextauth]
// This route is kept for backward compatibility only
export async function POST() {
  return NextResponse.json({ message: "Please use /api/auth/signin" }, { status: 308 });
}
