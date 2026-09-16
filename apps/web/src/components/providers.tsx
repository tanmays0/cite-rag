"use client";

import { SessionProvider } from "next-auth/react";
import { MotionProvider } from "@/components/motion/providers";
import { LenisProvider } from "@/components/marketing/lenis-provider";
import { AppShell } from "@/components/shell/app-shell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MotionProvider>
        <LenisProvider>
          <AppShell>{children}</AppShell>
        </LenisProvider>
      </MotionProvider>
    </SessionProvider>
  );
}
