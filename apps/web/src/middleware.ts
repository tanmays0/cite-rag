import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Include exact /chat and /library — `:path*` alone does not match the bare route.
  matcher: ["/chat", "/chat/:path*", "/library", "/library/:path*"],
};
