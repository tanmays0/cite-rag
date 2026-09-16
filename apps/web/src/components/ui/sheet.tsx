"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  title = "Panel",
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55 data-[state=open]:animate-in" />
      <Dialog.Content asChild>
        <motion.div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-elevated p-4 shadow-2xl outline-none md:hidden",
            className,
          )}
          initial={reduce ? false : { y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="font-mono text-xs uppercase tracking-[0.18em] text-mist">
              {title}
            </Dialog.Title>
            <Dialog.Close className="cursor-pointer rounded-md p-1.5 text-mist hover:bg-white/5 hover:text-paper">
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {children}
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
