"use client";

import { SOCKET_EVENTS, type PublicRoom } from "@partyverse/shared";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Leaderboard } from "@/components/game/Leaderboard";
import { TimerBar } from "@/components/game/TimerBar";

export function DesiDilemma({
  room,
  playerId,
  emit,
}: {
  room: PublicRoom;
  playerId: string | null;
  emit: (event: string, payload?: unknown) => void;
}) {
  const [picked, setPicked] = useState(false);
  const prompt = room.dilemmaPrompt;

  if (room.state === "ROUND_RESULTS" && room.dilemmaResult) {
    const result = room.dilemmaResult;
    return (
      <div className="space-y-4 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <h2 className="font-display text-2xl font-bold">Round results</h2>
        <p className="text-sm text-slate">
          Scoring:{" "}
          <span className="font-semibold text-ink">
            {result.scoring === "majority" ? "Majority wins" : "Minority wins"}
          </span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {result.tallies.map((t) => (
            <div
              key={t.option}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
            >
              <p className="font-semibold text-ink">{t.option}</p>
              <p className="text-sm text-slate">{t.count} votes</p>
            </div>
          ))}
        </div>
        <Leaderboard entries={result.leaderboard} />
      </div>
    );
  }

  if (room.state === "PREPARING_ROUND" || !prompt) {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        <p className="font-display text-2xl font-bold">Loading dilemma…</p>
      </div>
    );
  }

  const already =
    picked || (playerId ? room.dilemmaVotedIds.includes(playerId) : false);

  return (
    <div className="space-y-5 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber">
        {prompt.scoring === "majority" ? "Majority round" : "Minority round"}
      </p>
      <h2 className="font-display text-3xl font-bold tracking-tight">
        {prompt.prompt}
      </h2>
      <TimerBar startedAt={prompt.startedAt} endsAt={prompt.endsAt} />
      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.options.map((option, index) => (
          <Button
            key={option}
            className="h-auto whitespace-normal py-4 text-left"
            variant={already ? "ghost" : "primary"}
            disabled={already}
            onClick={() => {
              setPicked(true);
              emit(SOCKET_EVENTS.DILEMMA_VOTE, {
                promptId: prompt.id,
                choiceIndex: index as 0 | 1,
              });
            }}
          >
            {option}
          </Button>
        ))}
      </div>
      {already && (
        <p className="text-sm font-semibold text-teal">
          Locked in · waiting for others…
        </p>
      )}
    </div>
  );
}
