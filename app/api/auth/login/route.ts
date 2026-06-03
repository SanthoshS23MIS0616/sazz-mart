import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { publicUser, setSessionCookie, verifyPassword } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ message: "Invalid login details" }, { status: 401 });
  }

  await setSessionCookie(user);
  return NextResponse.json({ user: publicUser(user) });
}
