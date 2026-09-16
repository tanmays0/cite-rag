"use client";

import { ReactNode } from "react";
import { SiteHeader } from "@/components/shell/site-header";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="atmosphere min-h-screen">
      <SiteHeader />
      <main className="relative z-[1]">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="atmosphere min-h-screen">
      <SiteHeader />
      <main className="relative z-[1]">{children}</main>
    </div>
  );
}
