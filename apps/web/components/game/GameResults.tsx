"use client";

import type { PublicRoom } from "@partyverse/shared";
import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/Button";
import { Leaderboard } from "@/components/game/Leaderboard";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { AvatarBadge } from "@/components/ui/AvatarBadge";

export function GameResults({
  room,
  isHost,
  onPlayAgain,
  onBackToLobby,
}: {
  room: PublicRoom;
  isHost: boolean;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}) {
  const winners = room.players.filter((p) => room.winnerIds.includes(p.id));
  const board = [...room.players]
    .map((p) => ({
      playerId: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
      <ConfettiBurst />
      <p className="text-sm font-semibold uppercase tracking-wide text-slate">Game over</p>
      <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
        {winners.length ? "Winner celebration" : "Party complete"}
      </h2>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {winners.map((w) => (
          <div key={w.id} className="flex flex-col items-center gap-2">
            <AvatarBadge avatar={w.avatar} size="lg" />
            <p className="font-display text-xl font-bold">{w.nickname}</p>
            <p className="text-teal">{w.score} pts</p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-md text-left">
        <Leaderboard entries={board} />
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {isHost ? (
          <Button onClick={onPlayAgain}>Play again</Button>
        ) : (
          <p className="text-sm text-slate">Waiting for host to start another round…</p>
        )}
        <Button variant="ghost" onClick={onBackToLobby}>
          Return to lobby
        </Button>
      </div>
      <AdSlot placement="between_games" />
    </div>
  );
}
