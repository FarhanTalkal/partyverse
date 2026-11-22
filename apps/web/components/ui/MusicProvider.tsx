"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type MusicMode = "lobby" | "game" | "off";

interface MusicContextValue {
  enabled: boolean;
  toggle: () => void;
  setMode: (mode: MusicMode) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

/** Soft generative ambient — no external audio files required. */
function createAmbient(
  ctx: AudioContext,
  kind: "lobby" | "game"
): { stop: () => void } {
  const master = ctx.createGain();
  master.gain.value = kind === "game" ? 0.035 : 0.028;
  master.connect(ctx.destination);

  const freqs =
    kind === "game" ? [196, 246.94, 293.66, 349.23] : [174.61, 220, 261.63, 329.63];
  const oscs: OscillatorNode[] = [];
  const now = ctx.currentTime;

  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i % 2 === 0 ? "sine" : "triangle";
    osc.frequency.value = f;
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.2 / freqs.length, now + 1.5 + i * 0.2);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05 + i * 0.02;
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(g);
    g.connect(master);
    osc.start();
    lfo.start();
    oscs.push(osc, lfo);
  });

  return {
    stop: () => {
      const t = ctx.currentTime;
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      window.setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        });
        master.disconnect();
      }, 500);
    },
  };
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setModeState] = useState<MusicMode>("lobby");
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  const start = useCallback(
    async (kind: "lobby" | "game") => {
      stop();
      if (typeof window === "undefined") return;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!ctxRef.current) ctxRef.current = new Ctx();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") await ctx.resume();
      stopRef.current = createAmbient(ctx, kind).stop;
    },
    [stop]
  );

  useEffect(() => {
    if (!enabled || mode === "off") {
      stop();
      return;
    }
    void start(mode);
    return () => stop();
  }, [enabled, mode, start, stop]);

  const toggle = useCallback(() => {
    setEnabled((v) => !v);
  }, []);

  const setMode = useCallback((next: MusicMode) => {
    setModeState(next);
  }, []);

  return (
    <MusicContext.Provider value={{ enabled, toggle, setMode }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}

export function MusicToggle() {
  const { enabled, toggle } = useMusic();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-ink"
      aria-pressed={enabled}
      title={enabled ? "Mute music" : "Play music"}
    >
      {enabled ? "Music on" : "Music"}
    </button>
  );
}
