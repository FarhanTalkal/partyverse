"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_MODE_META, GAME_MODES, type GameMode } from "@partyverse/shared";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { Section } from "@/components/ui/Section";
import { MusicToggle } from "@/components/ui/MusicProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AdSlot } from "@/components/ads/AdSlot";
import { savePreferredMode } from "@/lib/modes";

const steps = [
  "Enter a nickname and pick an avatar.",
  "Create a private room or join with a code.",
  "Pick a mode — switch anytime from the lobby.",
];

const modeAccent: Record<GameMode, string> = {
  brain: "border-l-[#12b5a0]",
  chaos: "border-l-[#ff5a3c]",
  bluff: "border-l-[#f5a524]",
  mind: "border-l-[#3b82f6]",
};

const soloModes = new Set<GameMode>(["brain", "mind"]);
const browseOrder: GameMode[] = [
  ...GAME_MODES.filter((m) => soloModes.has(m)),
  ...GAME_MODES.filter((m) => !soloModes.has(m)),
];

export function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5">
        <p className="font-display text-2xl font-extrabold tracking-tight text-ink">
          PartyVerse
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <MusicToggle />
          <ThemeToggle />
          <Button
            size="sm"
            variant="ghost"
            className="whitespace-nowrap"
            onClick={() => router.push("/setup?focus=join")}
          >
            Join room
          </Button>
          <Button
            size="sm"
            className="whitespace-nowrap"
            onClick={() => router.push("/setup")}
          >
            Play Now
          </Button>
        </div>
      </header>

      <section className="relative mx-auto flex min-h-[78svh] max-w-3xl flex-col items-center justify-center px-5 pb-16 pt-8 text-center">
        <div className="relative z-10 w-full">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-ink md:text-7xl"
          >
            PartyVerse
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-5 text-xl font-semibold tracking-tight text-ink sm:whitespace-nowrap sm:text-2xl md:text-3xl"
          >
            Party games the whole family can enjoy.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 text-sm text-slate sm:whitespace-nowrap sm:text-base md:text-lg"
          >
            Create a room, share a code, and play together.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Button size="lg" onClick={() => router.push("/setup")}>
              Play Now
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/setup?focus=join")}
            >
              Join with code
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                document.getElementById("modes")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Browse modes
            </Button>
          </motion.div>
        </div>
      </section>

      <Section id="modes" className="pt-4">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:whitespace-nowrap md:text-4xl">
          Four modes. Pick one and play.
        </h2>
        <p className="mt-3 text-slate sm:whitespace-nowrap">
          Start any game — hosts can switch anytime.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {browseOrder.map((mode, i) => {
            const meta = GAME_MODE_META[mode];
            const solo = soloModes.has(mode);
            return (
              <motion.article
                key={mode}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: i * 0.06 }}
                className={`flex min-h-[220px] flex-col rounded-[1.5rem] border-l-4 pv-card p-5 sm:p-6 ${modeAccent[mode]}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink dark:bg-white/10">
                    {solo ? "Solo" : "Multiplayer"}
                  </span>
                  {solo && (
                    <span className="inline-flex rounded-full bg-teal/15 px-3 py-1 text-xs font-bold text-teal">
                      Solo OK
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
                  {meta.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-amber">{meta.tagline}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">
                  {meta.blurb}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      savePreferredMode(mode);
                      router.push(`/modes/${mode}`);
                    }}
                  >
                    Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      savePreferredMode(mode);
                      router.push(`/setup?mode=${mode}`);
                    }}
                  >
                    Play {meta.name}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </Section>

      <Section id="how" className="pt-4">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          How to play
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step} className="rounded-[1.5rem] pv-card p-5">
              <span className="font-display text-3xl font-bold text-coral">
                {i + 1}
              </span>
              <p className="mt-3 text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <AdSlot placement="landing" />
      <Footer />
    </main>
  );
}
