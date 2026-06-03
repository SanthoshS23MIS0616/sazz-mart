import crypto from "crypto";
import { cookies } from "next/headers";
import type { PublicUser, Role, User } from "@/types/commerce";

const COOKIE_NAME = "luna_session";

function secret() {
  return process.env.AUTH_SECRET || "dev-secret-change-before-production";
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 64, "sha512", (error, derivedKey) => {
      if (error) reject(error);
      resolve(derivedKey.toString("hex"));
    });
  });
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 64, "sha512", (error, derivedKey) => {
      if (error) reject(error);
      resolve(derivedKey.toString("hex"));
    });
  });
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function publicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function createSession(user: User) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function readSession(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PublicUser & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, createdAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: User) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
}

export async function requireRole(role?: Role): Promise<{ user: PublicUser; error: null } | { user: null; error: Response }> {
  const user = await readSession();
  if (!user) {
    return { user: null, error: Response.json({ message: "Login required" }, { status: 401 }) };
  }
  if (role && user.role !== role) {
    return { user: null, error: Response.json({ message: "Admin access required" }, { status: 403 }) };
  }
  return { user, error: null };
}
