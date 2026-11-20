"use client";

import {
  BLUFF_RECOMMENDED_MIN,
  GAME_MODE_META,
  GAME_MODES,
  type GameMode,
} from "@partyverse/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { defaultSettingsFor } from "@/lib/modes";

export function GameSelect({
  playerCount,
  onSelect,
  onStart,
  onPractice,
  selectedMode,
  preferredMode,
  disabled,
}: {
  playerCount: number;
  selectedMode: GameMode | null;
  preferredMode?: GameMode | null;
  onSelect: (payload: Record<string, unknown>) => void;
  onStart: () => void;
  onPractice?: (mode: "brain" | "mind") => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<GameMode>(
    selectedMode ?? preferredMode ?? "brain"
  );

  useEffect(() => {
    const initial = selectedMode ?? preferredMode ?? "brain";
    setMode(initial);
    if (!selectedMode) onSelect(defaultSettingsFor(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(next: GameMode) {
    setMode(next);
    onSelect(defaultSettingsFor(next));
  }

  function startPractice() {
    if (mode !== "brain" && mode !== "mind") return;
    if (onPractice) {
      onPractice(mode);
      return;
    }
    onSelect(defaultSettingsFor(mode, true));
    setTimeout(() => onStart(), 80);
  }

  const canPractice = mode === "brain" || mode === "mind";

  return (
    <div className="rounded-[1.5rem] pv-card p-4">
      <h3 className="font-display text-xl font-bold text-ink">Pick a mode</h3>
      <p className="mt-1 text-sm text-slate">
        Start with friends, or practice Brain / Mind alone.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {GAME_MODES.map((id) => {
          const solo = id === "brain" || id === "mind";
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                mode === id
                  ? "bg-coral text-white shadow-glow"
                  : "bg-[var(--surface-strong)] text-ink hover:brightness-105"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{GAME_MODE_META[id].name}</p>
                {solo && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      mode === id
                        ? "bg-white/20 text-white"
                        : "bg-teal/15 text-teal"
                    }`}
                  >
                    Solo
                  </span>
                )}
              </div>
              <p className={`mt-1 text-xs ${mode === id ? "text-white/85" : "text-slate"}`}>
                {GAME_MODE_META[id].tagline}
              </p>
            </button>
          );
        })}
      </div>
      {mode === "bluff" && playerCount < BLUFF_RECOMMENDED_MIN && (
        <p className="mt-3 text-sm text-amber">
          Best with {BLUFF_RECOMMENDED_MIN}+ players. Smaller rooms still work.
        </p>
      )}
      <Button className="mt-4 w-full" disabled={disabled} onClick={onStart}>
        Start {GAME_MODE_META[mode].name}
      </Button>
      {canPractice && (
        <Button
          className="mt-2 w-full"
          variant="ghost"
          onClick={startPractice}
        >
          Practice solo ({GAME_MODE_META[mode].name})
        </Button>
      )}
    </div>
  );
}
