import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { emailSchema } from "@/lib/password";
import {
  HOUR_MS,
  loginAccountFailLimit,
  peekLimit,
  takeToken,
} from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: emailSchema,
  // Allow guest one-time secrets (≥8) and registered passwords (≥8).
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.trim().toLowerCase();
        const { password } = parsed.data;

        const failKey = `login:fail:${email}`;
        const failLimit = loginAccountFailLimit();
        const locked = peekLimit(failKey, failLimit, HOUR_MS);
        if (!locked.allowed) {
          return null;
        }

        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = rows[0];
        if (!user) {
          takeToken(failKey, failLimit, HOUR_MS);
          return null;
        }
        const ok = await compare(password, user.passwordHash);
        if (!ok) {
          takeToken(failKey, failLimit, HOUR_MS);
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          isGuest: user.isGuest,
        };
      },
    }),
  ],
});
