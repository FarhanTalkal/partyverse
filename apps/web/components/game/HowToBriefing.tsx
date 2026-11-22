"use client";

import { GAME_MODE_META, SOCKET_EVENTS, type HowToBriefing as HowTo } from "@partyverse/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { HOWTO_STEPS } from "@/lib/howto";

export function HowToBriefingPanel({
  howto,
  playerId,
  connectedCount,
  emit,
}: {
  howto: HowTo;
  playerId: string | null;
  connectedCount: number;
  emit: (event: string, payload?: unknown) => void;
}) {
  const [now, setNow] = useState(Date.now());
  const acked = playerId ? howto.ackedIds.includes(playerId) : false;
  const steps = HOWTO_STEPS[howto.mode] ?? [];
  const left = Math.max(0, howto.endsAt - now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [howto.endsAt]);

  return (
    <div className="mx-auto max-w-xl rounded-[1.75rem] pv-card p-6 shadow-soft md:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber">
        How to play · {(left / 1000).toFixed(0)}s
      </p>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">
        {GAME_MODE_META[howto.mode].name}
      </h2>
      <p className="mt-2 text-slate">{GAME_MODE_META[howto.mode].blurb}</p>
      <ol className="mt-6 space-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-ink">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-snug">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-coral transition-[width] duration-200"
            style={{ width: `${Math.min(100, (left / 30000) * 100)}%` }}
          />
        </div>
        <p className="text-sm text-slate">
          Ready: {howto.ackedIds.length}/{connectedCount}
          {acked ? " · You're ready" : ""}
        </p>
      </div>
      <Button
        className="mt-4 w-full"
        disabled={acked}
        onClick={() => emit(SOCKET_EVENTS.GAME_HOWTO_ACK)}
      >
        {acked ? "Got it — waiting for others…" : "Got it"}
      </Button>
      <p className="mt-3 text-center text-xs text-slate">
        Starts when everyone taps Got it, or when the timer hits zero.
      </p>
    </div>
  );
}
