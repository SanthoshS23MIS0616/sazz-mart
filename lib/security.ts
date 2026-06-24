import { auth } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import type { PublicUser, Role, User } from "@/types/commerce";

// Re-export for backward compatibility with register route
export { hashPassword, verifyPassword };

export function publicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function readSession(): Promise<PublicUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    id: (session.user as any).id || "",
    name: session.user.name || "",
    email: session.user.email,
    role: ((session.user as any).role || "user") as Role,
    createdAt: new Date().toISOString(),
  };
}

export async function requireRole(
  role?: Role
): Promise<{ user: PublicUser; error: null } | { user: null; error: Response }> {
  const user = await readSession();
  if (!user) {
    return { user: null, error: Response.json({ message: "Login required" }, { status: 401 }) };
  }
  if (role && user.role !== role) {
    return { user: null, error: Response.json({ message: "Admin access required" }, { status: 403 }) };
  }
  return { user, error: null };
}
