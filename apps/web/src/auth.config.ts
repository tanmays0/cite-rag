import type { NextAuthConfig } from "next-auth";

const useSecureCookies =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  useSecureCookies,
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
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
        token.isGuest = Boolean(
          (user as { isGuest?: boolean }).isGuest,
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = (token.email as string) || "";
        session.user.isGuest = Boolean(token.isGuest);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
