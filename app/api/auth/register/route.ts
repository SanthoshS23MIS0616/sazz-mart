import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { hashPassword, publicUser, setSessionCookie } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || password.length < 6) {
    return NextResponse.json({ message: "Name, valid email, and 6+ character password are required" }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ message: "This email is already registered" }, { status: 409 });
  }

  const user = await createUser({ name, email, passwordHash: await hashPassword(password), role: "user" });
  await setSessionCookie(user);
  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
