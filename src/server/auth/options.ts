import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/server/db";
import { ensureDefaultTenantForUser } from "@/server/auth/onboarding";
import { verifyPassword } from "@/server/security/password";
import { loginSchema } from "@/server/validators/auth";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "E-Mail und Passwort",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true
          }
        });

        if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await ensureDefaultTenantForUser({
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null
        });

        const membership = await prisma.tenantMembership.findFirst({
          where: { userId: user.id },
          select: { tenantId: true }
        });

        if (membership) {
          await prisma.auditLog.create({
            data: {
              tenantId: membership.tenantId,
              actorId: user.id,
              action: "LOGIN",
              entityType: "User",
              entityId: user.id,
              metadata: { provider: "credentials" }
            }
          });
        }
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
};
