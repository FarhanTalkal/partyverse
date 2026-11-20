import type { LeaderboardEntry } from "@partyverse/shared";
import { AvatarBadge } from "@/components/ui/AvatarBadge";

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <ol className="space-y-2">
      {entries.map((e, i) => (
        <li
          key={e.playerId}
          className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2"
        >
          <span className="w-6 font-display text-lg font-bold text-coral">{i + 1}</span>
          <AvatarBadge avatar={e.avatar} size="sm" />
          <span className="flex-1 font-semibold">{e.nickname}</span>
          <span className="font-semibold text-teal">{e.score}</span>
        </li>
      ))}
    </ol>
  );
}
