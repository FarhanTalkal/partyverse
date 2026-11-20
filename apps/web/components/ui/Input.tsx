"use client";

import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-ink outline-none transition placeholder:text-slate/70 focus:border-teal/40 focus:ring-4 focus:ring-teal/10",
        className
      )}
      {...props}
    />
  );
}
