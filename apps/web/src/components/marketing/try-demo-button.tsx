"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TryDemoButtonProps = {
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
};

export function TryDemoButton({
  size = "lg",
  className,
  children = "Try the live demo",
}: TryDemoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@cite-rag.app",
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo-cite-rag-2026",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Demo unavailable — open Sign in and try again.");
      router.push("/login?callbackUrl=/chat");
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-2">
      <Button
        type="button"
        size={size}
        className={className}
        onClick={startDemo}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Starting demo…" : children}
      </Button>
      {error ? (
        <p
          className="absolute top-full left-0 z-10 mt-1 max-w-[16rem] font-mono text-xs text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
