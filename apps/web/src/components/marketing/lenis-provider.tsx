"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/** Smooth scroll only on the marketing landing page — never on chat. */
export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.05,
    });

    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
