"use client";

import {
  SOCKET_EVENTS,
  type BluffPrivateInfo,
  type PublicRoom,
} from "@partyverse/shared";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Leaderboard } from "@/components/game/Leaderboard";
import { TimerBar } from "@/components/game/TimerBar";

export function BluffBetray({
  room,
  playerId,
  privateInfo,
  emit,
}: {
  room: PublicRoom;
  playerId: string | null;
  privateInfo: BluffPrivateInfo | null;
  emit: (event: string, payload?: unknown) => void;
}) {
  const [voted, setVoted] = useState(false);
  const scenario = room.bluffScenario;

  if (room.state === "PREPARING_ROUND") {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        <p className="font-display text-2xl font-bold">Assembling the mystery…</p>
      </div>
    );
  }

  if (room.state === "GAME_RESULTS" && room.bluffReveal) {
    const reveal = room.bluffReveal;
    return (
      <div className="space-y-4 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <h2 className="font-display text-2xl font-bold">Reveal</h2>
        <p>
          The culprit was{" "}
          <span className="font-semibold text-coral">{reveal.culpritNickname}</span>.
        </p>
        <ul className="space-y-2">
          {reveal.roles.map((r) => (
            <li key={r.playerId} className="rounded-2xl bg-white/80 px-4 py-2">
              <span className="font-semibold">{r.nickname}</span>
              <span className="text-slate"> — {r.role}</span>
            </li>
          ))}
        </ul>
        <Leaderboard entries={reveal.leaderboard} />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        Loading Bluff & Betray…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate">
          {scenario.phase}
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
          {scenario.title}
        </h2>
        <p className="mt-3 text-slate">{scenario.synopsis}</p>
        <ul className="mt-4 space-y-2">
          {scenario.publicClues.map((clue) => (
            <li key={clue} className="rounded-2xl bg-white/80 px-4 py-3 text-sm">
              {clue}
            </li>
          ))}
        </ul>
        {scenario.phase === "discussion" && scenario.discussionEndsAt && (
          <div className="mt-4">
            <TimerBar
              startedAt={scenario.discussionEndsAt - 60000}
              endsAt={scenario.discussionEndsAt}
            />
          </div>
        )}
        {scenario.phase === "voting" && scenario.voteEndsAt && (
          <div className="mt-4">
            <TimerBar
              startedAt={scenario.voteEndsAt - 30000}
              endsAt={scenario.voteEndsAt}
            />
          </div>
        )}
      </div>

      {privateInfo && (
        <div className="rounded-[1.75rem] border border-coral/30 bg-coral/10 p-6">
          <h3 className="font-display text-xl font-bold">Your private brief</h3>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Role:</span> {privateInfo.role}
          </p>
          <p className="mt-2 text-sm text-slate">{privateInfo.background}</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Secret objective:</span>{" "}
            {privateInfo.secretObjective}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {privateInfo.privateClues.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate">
            Only you can see this. Don&apos;t share your screen.
          </p>
        </div>
      )}

      {scenario.phase === "voting" && (
        <div className="rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
          <h3 className="font-display text-xl font-bold">Who is the culprit?</h3>
          <div className="mt-4 grid gap-2">
            {room.players
              .filter((p) => p.id !== playerId)
              .map((p) => (
                <Button
                  key={p.id}
                  variant="ghost"
                  disabled={voted}
                  onClick={() => {
                    setVoted(true);
                    emit(SOCKET_EVENTS.BLUFF_VOTE, { targetPlayerId: p.id });
                  }}
                >
                  {p.nickname}
                </Button>
              ))}
          </div>
          {voted && <p className="mt-3 text-sm font-semibold text-teal">Vote locked.</p>}
        </div>
      )}

      {scenario.phase === "discussion" && (
        <p className="text-center text-sm text-slate">
          Discuss in chat. Additional pressure builds until voting begins.
        </p>
      )}
    </div>
  );
}
