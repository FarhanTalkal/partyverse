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
  setIntensity: (value: number) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

/** Warm major-pentatonic party loop with soft kick + shimmer — less harsh than square leads. */
function createPartyEngine(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.2;
  compressor.connect(master);

  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  const bassFilter = ctx.createBiquadFilter();
  bass.type = "sine";
  bass.frequency.value = 98;
  bassFilter.type = "lowpass";
  bassFilter.frequency.value = 180;
  bassGain.gain.value = 0.28;
  bass.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(compressor);

  const pad = ctx.createOscillator();
  const pad2 = ctx.createOscillator();
  const padGain = ctx.createGain();
  pad.type = "triangle";
  pad2.type = "sine";
  pad.frequency.value = 196;
  pad2.frequency.value = 246.94;
  padGain.gain.value = 0.07;
  pad.connect(padGain);
  pad2.connect(padGain);
  padGain.connect(compressor);

  const lead = ctx.createOscillator();
  const leadGain = ctx.createGain();
  const leadFilter = ctx.createBiquadFilter();
  lead.type = "triangle";
  lead.frequency.value = 392;
  leadFilter.type = "lowpass";
  leadFilter.frequency.value = 2200;
  leadGain.gain.value = 0.0001;
  lead.connect(leadFilter);
  leadFilter.connect(leadGain);
  leadGain.connect(compressor);

  // Soft noise kick/snare via buffer
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.0001;
  noiseGain.connect(compressor);

  bass.start();
  pad.start();
  pad2.start();
  lead.start();

  let mode: "lobby" | "game" = "lobby";
  let intensity = 0;
  let step = 0;
  let timer: number | null = null;

  // Two rotating pentatonic phrases so loops feel less mechanical
  const lobbyA = [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66];
  const lobbyB = [293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63];
  const gameA = [329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63];
  const gameB = [392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23];
  const bassNotesLobby = [130.81, 130.81, 98.0, 98.0, 110.0, 110.0, 98.0, 98.0];
  const bassNotesGame = [146.83, 146.83, 110.0, 110.0, 123.47, 123.47, 98.0, 98.0];

  function hitPerc(now: number, kind: "kick" | "hat") {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = kind === "kick" ? "lowpass" : "highpass";
    f.frequency.value = kind === "kick" ? 140 : 5000;
    const peak = kind === "kick" ? 0.16 + intensity * 0.1 : 0.035 + intensity * 0.04;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "kick" ? 0.14 : 0.05));
    src.connect(f);
    f.connect(g);
    g.connect(compressor);
    src.start(now);
    src.stop(now + 0.2);
  }

  function schedule() {
    const now = ctx.currentTime;
    const bpm = mode === "lobby" ? 100 + intensity * 10 : 118 + intensity * 36;
    const beatSec = 60 / bpm;
    const phrase = Math.floor(step / 8) % 2 === 0;
    const notes =
      mode === "lobby" ? (phrase ? lobbyA : lobbyB) : phrase ? gameA : gameB;
    const bassLine = mode === "lobby" ? bassNotesLobby : bassNotesGame;
    const note = notes[step % notes.length];
    const bassNote = bassLine[step % bassLine.length];

    lead.frequency.setTargetAtTime(note, now, 0.02);
    pad.frequency.setTargetAtTime(note / 2, now, 0.1);
    pad2.frequency.setTargetAtTime((note / 2) * 1.25, now, 0.12);
    bass.frequency.setTargetAtTime(bassNote, now, 0.06);

    // Soft lead envelope — energetic in game, calmer in lobby
    const leadPeak =
      mode === "game" ? 0.085 + intensity * 0.07 : 0.055 + intensity * 0.02;
    leadGain.gain.cancelScheduledValues(now);
    leadGain.gain.setValueAtTime(Math.max(0.0001, leadPeak * 0.3), now);
    leadGain.gain.linearRampToValueAtTime(leadPeak, now + 0.025);
    leadGain.gain.linearRampToValueAtTime(leadPeak * 0.35, now + beatSec * 0.75);

    if (step % 2 === 0) hitPerc(now, "kick");
    if (mode === "game" || step % 4 === 1) hitPerc(now + beatSec * 0.5, "hat");

    const target =
      mode === "game" ? 0.12 + intensity * 0.06 : 0.09 + intensity * 0.025;
    master.gain.setTargetAtTime(target, now, 0.3);

    step += 1;
    timer = window.setTimeout(schedule, beatSec * 1000);
  }

  schedule();

  return {
    setMode(next: "lobby" | "game") {
      mode = next;
      step = 0;
    },
    setIntensity(v: number) {
      intensity = Math.max(0, Math.min(1, v));
    },
    stop() {
      if (timer) window.clearTimeout(timer);
      const t = ctx.currentTime;
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      window.setTimeout(() => {
        [bass, pad, pad2, lead].forEach((o) => {
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

type Engine = ReturnType<typeof createPartyEngine>;

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
      engineRef.current = createPartyEngine(ctx);
      engineRef.current.setIntensity(intensityRef.current);
    }
    return engineRef.current;
  }, []);

  // Keep the engine alive across lobby↔game so music doesn't cut out mid-session
  useEffect(() => {
    if (!enabled || mode === "off") {
      stop();
      return;
    }
    let cancelled = false;
    void ensureEngine().then((engine) => {
      if (cancelled || !engine) return;
      if (mode === "lobby" || mode === "game") engine.setMode(mode);
      engine.setIntensity(intensityRef.current);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, mode, ensureEngine, stop]);

  useEffect(() => () => stop(), [stop]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

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
