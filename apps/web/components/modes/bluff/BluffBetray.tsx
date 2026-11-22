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
import { ChatPanel } from "@/components/lobby/ChatPanel";
import { cn } from "@/lib/cn";

const PHASE_LABEL: Record<string, string> = {
  briefing: "Reading time",
  discussion: "Discussion time",
  voting: "Voting",
  reveal: "Reveal",
};

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
        <p className="text-lg">
          The culprit was{" "}
          <span className="rounded-lg bg-coral/20 px-2 py-0.5 font-extrabold text-coral">
            {reveal.culpritNickname}
          </span>
          .
        </p>
        <ul className="space-y-2">
          {reveal.roles.map((r) => {
            const isCulprit = r.playerId === reveal.culpritPlayerId;
            return (
              <li
                key={r.playerId}
                className={cn(
                  "rounded-2xl px-4 py-3",
                  isCulprit
                    ? "border-2 border-coral bg-coral/15 shadow-glow"
                    : "border border-teal/30 bg-teal/10"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{r.nickname}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                      isCulprit ? "bg-coral" : "bg-teal"
                    )}
                  >
                    {isCulprit ? "Culprit" : "Innocent"}
                  </span>
                </div>
                <span className="text-sm text-slate">{r.role}</span>
              </li>
            );
          })}
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

  const phaseStarted = scenario.phaseStartedAt ?? Date.now() - 1000;

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber">
          {PHASE_LABEL[scenario.phase] ?? scenario.phase}
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
          {scenario.title}
        </h2>
        <p className="mt-3 text-slate">{scenario.synopsis}</p>

        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate">
            Case clues · not choices
          </p>
          <ul className="space-y-2 border-l-2 border-amber/50 pl-4">
            {scenario.publicClues.map((clue, i) => (
              <li key={clue} className="text-sm leading-relaxed text-ink">
                <span className="mr-2 font-bold text-amber">{i + 1}.</span>
                {clue}
              </li>
            ))}
          </ul>
        </div>

        {scenario.phase === "briefing" && scenario.briefingEndsAt && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate">
              Read the case and your private brief. Chat unlocks in discussion.
            </p>
            <TimerBar startedAt={phaseStarted} endsAt={scenario.briefingEndsAt} />
          </div>
        )}
        {scenario.phase === "discussion" && scenario.discussionEndsAt && (
          <div className="mt-4">
            <TimerBar startedAt={phaseStarted} endsAt={scenario.discussionEndsAt} />
          </div>
        )}
        {scenario.phase === "voting" && scenario.voteEndsAt && (
          <div className="mt-4">
            <TimerBar startedAt={phaseStarted} endsAt={scenario.voteEndsAt} />
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

      {scenario.phase === "discussion" && (
        <div className="space-y-4 rounded-[1.75rem] border border-teal/30 bg-teal/5 p-4">
          <p className="text-sm font-semibold text-ink">
            Discussion is open — chat with the group. Clues stay visible above.
          </p>
          <ChatPanel
            messages={room.chat}
            onSend={(text) => emit(SOCKET_EVENTS.CHAT_SEND, { text })}
          />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <p className="mb-3 text-sm font-semibold text-ink">
              Ready for voting?{" "}
              <span className="font-normal text-slate">
                ({room.bluffReadyIds.length}/
                {room.players.filter((p) => p.connected).length})
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {room.players
                .filter((p) => p.connected)
                .map((p) => {
                  const ready = room.bluffReadyIds.includes(p.id);
                  const isSelf = p.id === playerId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!isSelf}
                      onClick={() => {
                        if (!isSelf) return;
                        emit(SOCKET_EVENTS.BLUFF_READY, { ready: !ready });
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                        ready
                          ? "border-teal bg-teal/15 text-teal"
                          : "border-[var(--border)] text-slate",
                        isSelf && "ring-2 ring-coral/40"
                      )}
                      aria-pressed={ready}
                    >
                      <span aria-hidden>{ready ? "✓" : "○"}</span>
                      {p.nickname}
                      {isSelf ? " (you)" : ""}
                    </button>
                  );
                })}
            </div>
            <p className="mt-2 text-xs text-slate">
              When everyone ticks ready, voting starts early.
            </p>
          </div>
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
    </div>
  );
}
