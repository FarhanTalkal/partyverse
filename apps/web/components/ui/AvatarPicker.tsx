"use client";

import { AVATARS, AVATAR_META, type AvatarId } from "@partyverse/shared";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { AvatarBadge } from "./AvatarBadge";

export function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarId;
  onChange: (avatar: AvatarId) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {AVATARS.map((avatar) => {
        const selected = value === avatar;
        return (
          <motion.button
            key={avatar}
            type="button"
            whileHover={{ y: -2, scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(avatar)}
            className={cn(
              "relative flex aspect-square items-center justify-center rounded-2xl border-2 p-1.5 transition",
              selected
                ? "border-coral bg-coral/10 shadow-glow"
                : "border-transparent bg-[var(--surface-strong)] hover:border-[var(--border)]"
            )}
            aria-label={`Select ${AVATAR_META[avatar].label}`}
            aria-pressed={selected}
          >
            <AvatarBadge avatar={avatar} size="md" />
            {selected && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white shadow-soft">
                ✓
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
