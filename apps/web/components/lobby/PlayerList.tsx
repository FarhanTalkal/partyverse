"use client";

import type { PublicPlayer } from "@partyverse/shared";
import { AvatarBadge } from "@/components/ui/AvatarBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function PlayerList({
  players,
  selfId,
  isHost = false,
  onMakeHost,
  onRejoin,
}: {
  players: PublicPlayer[];
  selfId: string | null;
  isHost?: boolean;
  onMakeHost?: (playerId: string) => void;
  onRejoin?: () => void;
}) {
  return (
    <ul className="space-y-2">
      {players.map((p) => {
        const isSelf = p.id === selfId;
        return (
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
                {isSelf ? " (you)" : ""}
                {p.isHost ? " · Host" : ""}
              </p>
              <p className="text-xs text-slate">
                {p.connected ? (p.ready ? "Ready" : "Not ready") : null}
                {p.connected ? " · " : null}
                {p.score} pts
              </p>
              {isHost && !isSelf && p.connected && onMakeHost && (
                <button
                  type="button"
                  className="mt-1 text-[11px] font-semibold text-amber underline-offset-2 hover:underline"
                  onClick={() => onMakeHost(p.id)}
                >
                  Make host
                </button>
              )}
              {isSelf && !p.connected && onRejoin && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={onRejoin}
                >
                  Rejoin
                </Button>
              )}
            </div>
            {p.connected ? (
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  p.ready ? "bg-teal" : "bg-slate/40"
                )}
              />
            ) : (
              <span className="shrink-0 rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber">
                Away
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
