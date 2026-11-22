"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-coral text-white shadow-glow hover:brightness-105 active:brightness-95",
  secondary:
    "bg-amber text-[#1a1200] hover:brightness-105",
  ghost:
    "bg-[var(--surface-strong)] text-ink border-2 border-[var(--border)] shadow-sm hover:border-ink/25 hover:brightness-[1.02]",
  danger:
    "bg-ink text-white hover:opacity-90",
};

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-5 py-3 text-base",
        size === "lg" && "px-7 py-4 text-lg",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
