"use client";

import type { CSSProperties } from "react";
import { AVATAR_META, type AvatarId } from "@partyverse/shared";
import { cn } from "@/lib/cn";

const orbs: Record<AvatarId, { from: string; to: string }> = {
  cat: { from: "#ff8a5c", to: "#c23b22" },
  lion: { from: "#ffb020", to: "#e4572e" },
  ironman: { from: "#ff5a3c", to: "#ffd36e" },
  panda: { from: "#7eb6ff", to: "#3d5afe" },
  fox: { from: "#ff7a59", to: "#c23b22" },
  tiger: { from: "#ff9f43", to: "#b45309" },
  peacock: { from: "#2de2c4", to: "#0f766e" },
  robot: { from: "#a78bfa", to: "#4c1d95" },
};

export function AvatarBadge({
  avatar,
  size = "md",
  className,
  showLabel = false,
}: {
  avatar: AvatarId;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}) {
  const orb = orbs[avatar];
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "pv-avatar-orb relative flex items-center justify-center overflow-hidden rounded-full",
          size === "sm" && "h-10 w-10 text-xl",
          size === "md" && "h-14 w-14 text-3xl",
          size === "lg" && "h-20 w-20 text-5xl"
        )}
        style={
          {
            "--orb-from": orb.from,
            "--orb-to": orb.to,
          } as CSSProperties
        }
        title={AVATAR_META[avatar].label}
        aria-label={AVATAR_META[avatar].label}
      >
        <span className="select-none drop-shadow-sm" aria-hidden>
          {AVATAR_META[avatar].emoji}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-ink">
          {AVATAR_META[avatar].label}
        </span>
      )}
    </div>
  );
}
