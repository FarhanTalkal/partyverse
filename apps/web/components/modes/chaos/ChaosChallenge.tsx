"use client";

import { SOCKET_EVENTS, type PublicRoom } from "@partyverse/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Leaderboard } from "@/components/game/Leaderboard";
import { TimerBar } from "@/components/game/TimerBar";

export function ChaosChallenge({
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
  const prompt = room.chaosPrompt;
  const voting = Boolean(room.chaosResponses?.length);
  const voted =
    Boolean(playerId && room.chaosVotedIds?.includes(playerId)) || false;

  useEffect(() => {
    setSubmitted(false);
    setText("");
  }, [prompt?.id]);

  if (room.state === "PREPARING_ROUND") {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        <p className="font-display text-2xl font-bold">Brewing chaos…</p>
      </div>
    );
  }

  if (room.state === "ROUND_RESULTS" && room.chaosResult) {
    return (
      <div className="space-y-4 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <h2 className="font-display text-2xl font-bold">Chaos results</h2>
        <ul className="space-y-2">
          {room.chaosResult.responses.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white/80 px-4 py-3 dark:bg-white/5">
              <p className="font-semibold">{r.nickname}</p>
              <p className="text-slate">{r.text}</p>
              <p className="mt-1 text-xs text-teal">
                {r.votes} votes · +{r.points} pts
              </p>
            </li>
          ))}
        </ul>
        <Leaderboard entries={room.chaosResult.leaderboard} />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        Loading Chaos Challenge…
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
      <div className="text-sm text-slate">
        Round {room.roundIndex + 1}/{room.totalRounds} · {prompt.type.replaceAll("_", " ")}
      </div>
      <TimerBar startedAt={prompt.startedAt} endsAt={prompt.endsAt} />
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {prompt.prompt}
      </h2>

      {!voting ? (
        <>
          {prompt.options?.length ? (
            <div className="grid gap-3">
              {prompt.options.map((opt) => (
                <Button
                  key={opt}
                  variant="ghost"
                  disabled={submitted}
                  className="justify-start"
                  onClick={() => {
                    setSubmitted(true);
                    emit(SOCKET_EVENTS.CHAOS_RESPOND, {
                      promptId: prompt.id,
                      text: opt,
                    });
                  }}
                >
                  {opt}
                </Button>
              ))}
            </div>
          ) : (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim() || submitted) return;
                setSubmitted(true);
                emit(SOCKET_EVENTS.CHAOS_RESPOND, {
                  promptId: prompt.id,
                  text,
                });
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Your chaotic answer"
                disabled={submitted}
                maxLength={280}
                className="sm:flex-1"
              />
              <Button
                type="submit"
                disabled={submitted || !text.trim()}
                className="shrink-0 whitespace-nowrap"
              >
                Send
              </Button>
            </form>
          )}
          {submitted && (
            <p className="text-sm font-semibold text-teal">Response locked. Waiting…</p>
          )}
        </>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate">
            Vote for your favorite (not your own)
          </p>
          {room.chaosResponses!.map((r) => (
            <Button
              key={r.id}
              variant="ghost"
              className="h-auto justify-start whitespace-normal py-4 text-left"
              disabled={voted}
              onClick={() => {
                emit(SOCKET_EVENTS.CHAOS_VOTE, {
                  promptId: prompt.id,
                  responseId: r.id,
                });
              }}
            >
              <span className="mr-2 font-bold text-coral">{r.anonymousLabel}</span>
              {r.text}
            </Button>
          ))}
          {voted && (
            <p className="text-sm font-semibold text-teal">
              Vote submitted
              {(room.chaosVotedIds?.length ?? 0) <
              room.players.filter((p) => p.connected).length
                ? " · Waiting for everyone…"
                : " · Finishing round…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
