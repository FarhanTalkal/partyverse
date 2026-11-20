"use client";

import type { PublicPlayer } from "@partyverse/shared";
import { AvatarBadge } from "@/components/ui/AvatarBadge";
import { cn } from "@/lib/cn";

export function PlayerList({
  players,
  selfId,
}: {
  players: PublicPlayer[];
  selfId: string | null;
}) {
  return (
    <ul className="space-y-2">
      {players.map((p) => (
        <li
          key={p.id}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2",
            !p.connected && "opacity-80"
          )}
        >
          <AvatarBadge avatar={p.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">
              {p.nickname}
              {p.id === selfId ? " (you)" : ""}
              {p.isHost ? " · Host" : ""}
            </p>
            <p className="text-xs text-slate">
              {p.connected ? (p.ready ? "Ready" : "Not ready") : null}
              {p.connected ? " · " : null}
              {p.score} pts
            </p>
          </div>
          {p.connected ? (
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                p.ready ? "bg-teal" : "bg-slate/40"
              )}
            />
          ) : (
            <span className="shrink-0 rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-coral">
              Left
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
