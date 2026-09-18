"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TryGuestButtonProps = {
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
};

/** One-click guest session — isolated library, no signup form. */
export function TryGuestButton({
  size = "lg",
  className,
  children = "Try it now",
}: TryGuestButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startGuest() {
    setLoading(true);
    setError(null);
    try {
      const provision = await fetch("/api/auth/guest", { method: "POST" });
      const body = (await provision.json()) as {
        error?: string;
        email?: string;
        password?: string;
      };
      if (!provision.ok || !body.email || !body.password) {
        setError(body.error || "Guest session unavailable.");
        setLoading(false);
        return;
      }
      const res = await signIn("credentials", {
        email: body.email,
        password: body.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Could not sign in as guest. Try again.");
        setLoading(false);
        return;
      }
      router.push("/chat");
      router.refresh();
    } catch {
      setError("Network error starting guest session.");
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-2">
      <Button
        type="button"
        size={size}
        className={className}
        onClick={startGuest}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Starting…" : children}
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
