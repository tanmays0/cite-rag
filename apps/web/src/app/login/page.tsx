"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@cite-rag.app";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawCallback = params.get("callbackUrl");
  const callbackUrl = (() => {
    if (!rawCallback) return "/chat";
    if (rawCallback.startsWith("/") && !rawCallback.startsWith("//")) {
      return rawCallback;
    }
    try {
      const u = new URL(rawCallback);
      if (typeof window !== "undefined" && u.origin === window.location.origin) {
        return `${u.pathname}${u.search}${u.hash}` || "/chat";
      }
    } catch {
      // fall through
    }
    return "/chat";
  })();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("That email or password didn’t match.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-md flex-col justify-center px-6 pb-16">
      <h1 className="brand-mark text-4xl text-paper md:text-5xl">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-mist">
        Enter credentials to ask the corpus. Demo account:{" "}
        <span className="font-mono text-paper">{DEMO_EMAIL}</span>
        {" / "}
        <span className="font-mono text-paper">demo-cite-rag-2026</span>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-mist">
          Email
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            autoComplete="email"
            placeholder={DEMO_EMAIL}
          />
        </label>
        <label className="block text-sm text-mist">
          Password
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-mist">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
