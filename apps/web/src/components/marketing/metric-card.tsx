"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  delay?: number;
};

export function MetricCard({
  label,
  value,
  hint,
  className,
  delay = 0,
}: MetricCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      className={cn(
        "panel rounded-xl border border-white/10 bg-ink-elevated/60 p-5 backdrop-blur-sm",
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
        {label}
      </p>
      <p className="mt-3 font-mono text-2xl font-medium tracking-tight text-paper md:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-mist/80">{hint}</p>
      ) : null}
    </motion.article>
  );
}
