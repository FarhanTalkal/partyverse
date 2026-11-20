"use client";

import { useEffect, useState } from "react";

export function TimerBar({ endsAt, startedAt }: { endsAt: number; startedAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [endsAt]);

  const total = Math.max(1, endsAt - startedAt);
  const left = Math.max(0, endsAt - now);
  const pct = Math.min(100, (left / total) * 100);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-slate">
        <span>Time left</span>
        <span>{(left / 1000).toFixed(1)}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-coral transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
