"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { TryDemoButton } from "@/components/marketing/try-demo-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const appLinks = [
  { href: "/chat", label: "Chat" },
  { href: "/library", label: "Library" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isMarketing = pathname === "/" || pathname === "/login";
  const isLanding = pathname === "/";
  const isApp =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/evals");

  return (
    <header
      className={cn(
        "relative z-[2] mx-auto flex w-full items-center justify-between px-6",
        isApp ? "max-w-7xl py-3.5" : "max-w-6xl py-5",
      )}
    >
      <Link
        href="/"
        className={cn(
          "brand-mark text-paper transition hover:text-marker",
          isApp ? "text-xl" : "text-2xl",
        )}
      >
        cite-rag
      </Link>

      <nav className="flex items-center gap-1 text-sm text-mist">
        {isLanding ? (
          <>
            <Link
              href="#how-it-works"
              className="cursor-pointer rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-paper"
            >
              Pipeline
            </Link>
            <Link
              href="https://github.com/tanmays0/cite-rag"
              className="cursor-pointer rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-paper"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </Link>
            {session?.user ? (
              <Button asChild size="sm" className="ml-2" variant="secondary">
                <Link href="/chat">Open chat</Link>
              </Button>
            ) : (
              <TryDemoButton size="sm" className="ml-2">
                Try demo
              </TryDemoButton>
            )}
          </>
        ) : null}

        {(isApp || (!isMarketing && !isLanding)) &&
          appLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 transition",
                  active
                    ? "bg-white/10 text-paper"
                    : "hover:bg-white/5 hover:text-paper",
                )}
              >
                {link.label}
              </Link>
            );
          })}

        {isApp ? (
          <Link
            href="/evals"
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-1.5 text-xs text-mist/70 transition hover:bg-white/5 hover:text-mist",
              pathname.startsWith("/evals") && "text-mist",
            )}
            title="Evals"
          >
            Evals
          </Link>
        ) : null}

        {session?.user ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="ml-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        ) : !isLanding ? (
          <Button asChild size="sm" className="ml-2">
            <Link href="/login">Sign in</Link>
          </Button>
        ) : null}
      </nav>
    </header>
  );
}
