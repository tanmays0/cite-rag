"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Composer({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="border-t border-white/10 p-4">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask the corpus…"
          aria-label="Ask the corpus"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !value.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}
