import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail, findOrCreateGoogleUser } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials.email || "").trim().toLowerCase();
        const password = String(credentials.password || "");
        if (!email || !password) return null;
        const user = await findUserByEmail(email);
        if (!user || !user.passwordHash) return null;
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        await findOrCreateGoogleUser({
          name: profile.name || profile.email,
          email: profile.email,
          image: (profile as any).picture || "",
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if ((user as any).role) {
          token.role = (user as any).role;
          token.id = user.id;
        } else {
          const dbUser = await findUserByEmail(user.email as string);
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "user";
        (session.user as any).id = token.id || token.sub;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
});
