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
  /** 0 = calm, 1 = urgent (near round end) */
  setIntensity: (value: number) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

function createLivelyEngine(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = "triangle";
  bass.frequency.value = 98;
  bassGain.gain.value = 0.22;
  bass.connect(bassGain);
  bassGain.connect(master);

  const lead = ctx.createOscillator();
  const leadGain = ctx.createGain();
  lead.type = "square";
  lead.frequency.value = 392;
  leadGain.gain.value = 0.06;
  lead.connect(leadGain);
  leadGain.connect(master);

  const pad = ctx.createOscillator();
  const padGain = ctx.createGain();
  pad.type = "sine";
  pad.frequency.value = 246.94;
  padGain.gain.value = 0.1;
  pad.connect(padGain);
  padGain.connect(master);

  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = "square";
  click.frequency.value = 880;
  clickGain.gain.value = 0.0001;
  click.connect(clickGain);
  clickGain.connect(master);

  bass.start();
  lead.start();
  pad.start();
  click.start();

  let mode: "lobby" | "game" = "lobby";
  let intensity = 0;
  let beat = 0;
  let timer: number | null = null;

  const lobbyMelody = [392, 440, 523.25, 440, 349.23, 392, 329.63, 392];
  const gameMelody = [523.25, 587.33, 659.25, 587.33, 698.46, 659.25, 523.25, 440];

  function schedule() {
    const now = ctx.currentTime;
    const bpm = mode === "lobby" ? 108 + intensity * 12 : 128 + intensity * 48;
    const beatSec = 60 / bpm;
    const mel = mode === "lobby" ? lobbyMelody : gameMelody;
    const note = mel[beat % mel.length];

    lead.frequency.setTargetAtTime(note, now, 0.01);
    pad.frequency.setTargetAtTime(note / 2, now, 0.05);
    bass.frequency.setTargetAtTime(mode === "game" ? 110 : 98, now, 0.08);

    // Percussive click on beats; stronger near end of rounds
    const clickPeak = mode === "game" ? 0.05 + intensity * 0.12 : 0.03;
    clickGain.gain.cancelScheduledValues(now);
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.linearRampToValueAtTime(clickPeak, now + 0.01);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    // Lead pulse
    const leadPeak = mode === "game" ? 0.08 + intensity * 0.1 : 0.07;
    leadGain.gain.cancelScheduledValues(now);
    leadGain.gain.setValueAtTime(leadPeak * 0.4, now);
    leadGain.gain.linearRampToValueAtTime(leadPeak, now + 0.04);
    leadGain.gain.linearRampToValueAtTime(leadPeak * 0.45, now + beatSec * 0.85);

    const targetMaster = mode === "game" ? 0.11 + intensity * 0.08 : 0.09;
    master.gain.setTargetAtTime(targetMaster, now, 0.2);

    beat += 1;
    timer = window.setTimeout(schedule, beatSec * 1000);
  }

  schedule();

  return {
    setMode(next: "lobby" | "game") {
      mode = next;
      beat = 0;
    },
    setIntensity(v: number) {
      intensity = Math.max(0, Math.min(1, v));
    },
    stop() {
      if (timer) window.clearTimeout(timer);
      const t = ctx.currentTime;
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      window.setTimeout(() => {
        [bass, lead, pad, click].forEach((o) => {
          try {
            o.stop();
          } catch {
            /* noop */
          }
        });
        master.disconnect();
      }, 400);
    },
  };
}

type Engine = ReturnType<typeof createLivelyEngine>;

export function MusicProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setModeState] = useState<MusicMode>("lobby");
  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const intensityRef = useRef(0);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
  }, []);

  const ensureEngine = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    if (!ctxRef.current) ctxRef.current = new Ctx();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();
    if (!engineRef.current) {
      engineRef.current = createLivelyEngine(ctx);
      engineRef.current.setIntensity(intensityRef.current);
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    if (!enabled || mode === "off") {
      stop();
      return;
    }
    void ensureEngine().then((engine) => {
      engine?.setMode(mode);
      engine?.setIntensity(intensityRef.current);
    });
    return () => stop();
  }, [enabled, mode, ensureEngine, stop]);

  const toggle = useCallback(() => {
    setEnabled((v) => !v);
  }, []);

  const setMode = useCallback((next: MusicMode) => {
    setModeState(next);
    if (next === "lobby" || next === "game") {
      engineRef.current?.setMode(next);
    }
  }, []);

  const setIntensity = useCallback((value: number) => {
    intensityRef.current = value;
    engineRef.current?.setIntensity(value);
  }, []);

  return (
    <MusicContext.Provider value={{ enabled, toggle, setMode, setIntensity }}>
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
      className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-base"
      aria-pressed={enabled}
      aria-label={enabled ? "Mute music" : "Play music"}
      title={enabled ? "Mute music" : "Play music"}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
