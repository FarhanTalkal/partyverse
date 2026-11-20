"use client";

import { SOCKET_EVENTS, type PublicRoom } from "@partyverse/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Leaderboard } from "@/components/game/Leaderboard";
import { TimerBar } from "@/components/game/TimerBar";

export function MindMatch({
  room,
  emit,
}: {
  room: PublicRoom;
  emit: (event: string, payload?: unknown) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const prompt = room.mindPrompt;

  useEffect(() => {
    setSubmitted(false);
    setAnswer("");
  }, [prompt?.id]);

  if (room.state === "PREPARING_ROUND") {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft backdrop-blur">
        <p className="font-display text-2xl font-bold">Syncing minds…</p>
      </div>
    );
  }

  if (room.state === "ROUND_RESULTS" && room.mindResult) {
    return (
      <div className="space-y-4 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft backdrop-blur">
        <h2 className="font-display text-2xl font-bold">Mind Match results</h2>
        <div className="space-y-2">
          {room.mindResult.clusters.map((c) => (
            <div key={c.answer + c.size} className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="font-semibold text-amber">
                “{c.answer}” · {c.size} player{c.size > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
        <ul className="space-y-2">
          {room.mindResult.submissions.map((s) => (
            <li key={s.playerId} className="rounded-2xl bg-white/5 px-4 py-2 text-sm">
              <span className="font-semibold">{s.nickname}</span>
              <span className="text-slate"> — {s.answer || "(blank)"}</span>
              <span className="ml-2 text-teal">
                {s.matchCount} matches · +{s.points}
              </span>
            </li>
          ))}
        </ul>
        <Leaderboard entries={room.mindResult.leaderboard} />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        Loading Mind Match…
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft backdrop-blur">
      <div className="text-sm text-slate">
        Round {room.roundIndex + 1}/{room.totalRounds} · Match your friends
      </div>
      <TimerBar startedAt={prompt.startedAt} endsAt={prompt.endsAt} />
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {prompt.prompt}
      </h2>
      {prompt.hint && <p className="text-sm text-amber">{prompt.hint}</p>}
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!answer.trim() || submitted) return;
          setSubmitted(true);
          emit(SOCKET_EVENTS.MIND_ANSWER, {
            promptId: prompt.id,
            answer,
          });
        }}
      >
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="One word / short phrase"
          disabled={submitted}
          maxLength={80}
          className="sm:flex-1"
        />
        <Button
          type="submit"
          disabled={submitted || !answer.trim()}
          className="h-12 shrink-0 whitespace-nowrap px-6"
        >
          Lock in
        </Button>
      </form>
      {submitted && (
        <p className="text-sm font-semibold text-teal">
          Locked. Waiting for the hive mind…
        </p>
      )}
    </div>
  );
}
