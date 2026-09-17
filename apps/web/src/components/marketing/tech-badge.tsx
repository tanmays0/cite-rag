import { cn } from "@/lib/utils";

type TechBadgeProps = {
  label: string;
  className?: string;
};

export function TechBadge({ label, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper-dim transition hover:border-marker/40 hover:text-marker",
        className,
      )}
    >
      {label}
    </span>
  );
}
