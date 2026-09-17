"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  async function useDemo() {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@cite-rag.app",
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo-cite-rag-2026",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Demo user isn’t ready yet. Seed with pnpm db:seed-demo.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  useEffect(() => {
    if (params.get("demo") === "1") {
      void useDemo();
    }
    // Auto-start demo once when ?demo=1 is present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-md flex-col justify-center px-6 pb-16">
      <h1 className="brand-mark text-4xl text-paper md:text-5xl">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-mist">
        Sign in to ask the corpus. Demo account is one click.
      </p>

      <Button
        type="button"
        size="lg"
        className="mt-8 w-full"
        onClick={useDemo}
        disabled={loading}
      >
        {loading ? "Signing in…" : "Use demo account"}
      </Button>

      <div className="my-8 flex items-center gap-3 text-xs text-mist/60">
        <span className="h-px flex-1 bg-white/10" />
        or with email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm text-mist">
          Email
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            autoComplete="email"
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
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={loading}
        >
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
