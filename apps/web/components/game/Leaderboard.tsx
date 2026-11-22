import type { LeaderboardEntry } from "@partyverse/shared";
import { AvatarBadge } from "@/components/ui/AvatarBadge";

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <ol className="space-y-2">
      {entries.map((e, i) => (
        <li
          key={e.playerId}
          className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5"
        >
          <span className="w-6 font-display text-lg font-bold text-coral">
            {i + 1}
          </span>
          <AvatarBadge avatar={e.avatar} size="sm" />
          <span className="flex-1 font-semibold text-ink">{e.nickname}</span>
          <span className="rounded-full bg-ink px-2.5 py-1 text-sm font-extrabold tabular-nums text-[var(--color-foam)] dark:bg-teal dark:text-ink">
            {e.score}
          </span>
        </li>
      ))}
    </ol>
  );
}
