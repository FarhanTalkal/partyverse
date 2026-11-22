"use client";

import { SOCKET_EVENTS, type PublicRoom } from "@partyverse/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Leaderboard } from "@/components/game/Leaderboard";
import { TimerBar } from "@/components/game/TimerBar";

export function GeetRound({
  room,
  playerId,
  emit,
}: {
  room: PublicRoom;
  playerId: string | null;
  emit: (event: string, payload?: unknown) => void;
}) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [voted, setVoted] = useState(false);
  const prompt = room.geetPrompt;

  // Reset input/locks whenever a new round prompt starts
  useEffect(() => {
    setText("");
    setSubmitted(false);
    setVoted(false);
  }, [prompt?.id, room.roundIndex]);

  if (room.state === "ROUND_RESULTS" && room.geetResult) {
    return (
      <div className="space-y-4 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <h2 className="font-display text-2xl font-bold">Round results</h2>
        <ul className="space-y-2">
          {room.geetResult.responses.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
            >
              <div>
                <p className="font-semibold text-ink">{r.text}</p>
                <p className="text-xs text-slate">
                  {r.nickname} · {r.votes} votes
                </p>
              </div>
              <span className="rounded-full bg-ink px-2.5 py-1 text-sm font-extrabold text-[var(--color-foam)] dark:bg-teal dark:text-ink">
                {r.points}
              </span>
            </li>
          ))}
        </ul>
        <Leaderboard entries={room.geetResult.leaderboard} />
      </div>
    );
  }

  if (room.state === "PREPARING_ROUND" || !prompt) {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        <p className="font-display text-2xl font-bold">Cueing the next letter…</p>
      </div>
    );
  }

  const voting = Boolean(room.geetResponses?.length);

  return (
    <div className="space-y-5 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber">
        {voting ? "Vote for your favorite" : "Song title round"}
      </p>
      <h2 className="font-display text-4xl font-extrabold tracking-tight">
        Letter <span className="text-coral">{prompt.letter}</span>
      </h2>
      {prompt.hint && <p className="text-slate">Hint: {prompt.hint}</p>}
      <TimerBar startedAt={prompt.startedAt} endsAt={prompt.endsAt} />

      {!voting && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            key={`geet-input-${prompt.id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Starts with ${prompt.letter}…`}
            maxLength={80}
            disabled={submitted}
            autoFocus
          />
          <Button
            disabled={submitted || text.trim().length < 1}
            onClick={() => {
              setSubmitted(true);
              emit(SOCKET_EVENTS.GEET_RESPOND, {
                promptId: prompt.id,
                text: text.trim(),
              });
            }}
          >
            {submitted ? "Submitted" : "Send song"}
          </Button>
        </div>
      )}

      {voting && (
        <div className="grid gap-2">
          {room.geetResponses!.map((r) => (
            <Button
              key={r.id}
              variant="ghost"
              disabled={
                voted || (playerId ? room.geetVotedIds.includes(playerId) : false)
              }
              onClick={() => {
                setVoted(true);
                emit(SOCKET_EVENTS.GEET_VOTE, {
                  promptId: prompt.id,
                  responseId: r.id,
                });
              }}
            >
              <span className="mr-2 text-slate">{r.anonymousLabel}</span>
              {r.text}
            </Button>
          ))}
          {(voted || (playerId && room.geetVotedIds.includes(playerId))) && (
            <p className="text-sm font-semibold text-teal">Vote locked.</p>
          )}
        </div>
      )}
    </div>
  );
}
