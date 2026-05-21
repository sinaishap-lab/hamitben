import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "טלפון", type: "tel" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });
        if (!user || user.deletedAt) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          isBanned: user.isBanned,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.isBanned = user.isBanned;
        token.phone = user.phone;
      }
      // Refresh from DB on explicit update (e.g. admin approval)
      if (trigger === "update" && session?.refresh) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true, isBanned: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.status = fresh.status;
          token.isBanned = fresh.isBanned;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.isBanned = token.isBanned as boolean;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
};

/** Server-side helper – returns the authenticated session or null. */
export function auth() {
  return getServerSession(authOptions);
}

/** Server-side helper – returns the current user or null (non-deleted only). */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
  });
}
