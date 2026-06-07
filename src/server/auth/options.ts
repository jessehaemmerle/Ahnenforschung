import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/server/db";
import { ensureDefaultTenantForUser } from "@/server/auth/onboarding";

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasEmail =
  Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) &&
  Boolean(process.env.EMAIL_SERVER_USER || process.env.EMAIL_SERVER_PASSWORD);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
      allowDangerousEmailAccountLinking: false
    }),
    ...(hasEmail
      ? [
          EmailProvider({
            server: {
              host: process.env.EMAIL_SERVER_HOST,
              port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
              auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD
              }
            },
            from: process.env.EMAIL_FROM
          })
        ]
      : [])
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
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
              metadata: { provider: hasGoogle ? "oauth_or_email" : "email" }
            }
          });
        }
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
};

export const authProviderState = {
  hasGoogle,
  hasEmail
};
