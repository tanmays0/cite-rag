import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const protectedPaths = ["/chat", "/library"];
      const needsAuth = protectedPaths.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );
      if (needsAuth) return !!auth;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = (token.email as string) || "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
