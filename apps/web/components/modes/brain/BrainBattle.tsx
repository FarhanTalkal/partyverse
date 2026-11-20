"use client";

import { SOCKET_EVENTS, type PublicRoom } from "@partyverse/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Leaderboard } from "@/components/game/Leaderboard";
import { TimerBar } from "@/components/game/TimerBar";

export function BrainBattle({
  room,
  emit,
}: {
  room: PublicRoom;
  emit: (event: string, payload?: unknown) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const q = room.brainQuestion;
  const result = room.brainResult;

  useEffect(() => {
    setSubmitted(false);
    setAnswer("");
  }, [q?.id]);

  if (room.state === "PREPARING_ROUND") {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        <p className="font-display text-2xl font-bold">Preparing next question…</p>
      </div>
    );
  }

  if (room.state === "ROUND_RESULTS" && result) {
    return (
      <div className="space-y-4 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
        <h2 className="font-display text-2xl font-bold">Round results</h2>
        <p className="text-slate">
          Correct answer: <span className="font-semibold text-ink">{result.correctAnswer}</span>
        </p>
        {result.explanation && <p className="text-sm text-slate">{result.explanation}</p>}
        <Leaderboard entries={result.leaderboard} />
      </div>
    );
  }

  if (!q) {
    return (
      <div className="rounded-[1.75rem] bg-panel-wash p-8 text-center shadow-soft">
        Loading Brain Battle…
      </div>
    );
  }

  function submit(value: string) {
    if (submitted) return;
    setSubmitted(true);
    emit(SOCKET_EVENTS.BRAIN_ANSWER, { questionId: q!.id, answer: value });
  }

  return (
    <div className="space-y-5 rounded-[1.75rem] bg-panel-wash p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3 text-sm text-slate">
        <span>
          Round {room.roundIndex + 1}/{room.totalRounds}
        </span>
        <span className="rounded-full bg-teal/10 px-3 py-1 font-semibold text-teal">
          {q.category} · {q.difficulty}
        </span>
      </div>
      <TimerBar startedAt={q.startedAt} endsAt={q.endsAt} />
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{q.prompt}</h2>

      {q.type === "multiple_choice" && q.options ? (
        <div className="grid gap-3">
          {q.options.map((opt) => (
            <Button
              key={opt}
              variant="ghost"
              className="justify-start"
              disabled={submitted}
              onClick={() => submit(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(answer);
          }}
        >
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            disabled={submitted}
          />
          <Button type="submit" disabled={submitted || !answer.trim()}>
            Submit
          </Button>
        </form>
      )}

      {submitted && (
        <p className="text-sm font-semibold text-teal">Answer locked in. Waiting for others…</p>
      )}
    </div>
  );
}
