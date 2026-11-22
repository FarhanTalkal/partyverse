"use client";

import { useEffect, useState } from "react";
import { useMusic } from "@/components/ui/MusicProvider";

export function TimerBar({ endsAt, startedAt }: { endsAt: number; startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  const { setIntensity } = useMusic();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [endsAt]);

  const total = Math.max(1, endsAt - startedAt);
  const left = Math.max(0, endsAt - now);
  const pct = Math.min(100, (left / total) * 100);
  const urgency = 1 - left / total;

  useEffect(() => {
    // Ramp music energy as the timer runs down
    setIntensity(Math.max(0, Math.min(1, urgency * urgency * 1.15)));
    return () => setIntensity(0);
  }, [urgency, setIntensity]);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-slate">
        <span>Time left</span>
        <span>{(left / 1000).toFixed(1)}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ${
            urgency > 0.7 ? "bg-coral" : urgency > 0.4 ? "bg-amber" : "bg-teal"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
