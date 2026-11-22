"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { GAME_MODE_META, GAME_MODES, type GameMode } from "@partyverse/shared";
import { Button } from "@/components/ui/Button";
import { savePreferredMode } from "@/lib/modes";

export default function ModeDetailPage() {
  const params = useParams<{ mode: string }>();
  const mode = params.mode as GameMode;
  const valid = GAME_MODES.includes(mode);

  if (!valid) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="rounded-[1.5rem] bg-panel-wash p-8 text-center">
          <p className="font-display text-2xl font-bold">Mode not found</p>
          <Link href="/#modes" className="mt-4 inline-block">
            <Button>Back to modes</Button>
          </Link>
        </div>
      </main>
    );
  }

  const meta = GAME_MODE_META[mode];

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl rounded-[1.75rem] pv-card p-8">
        <Link href="/#modes" className="text-sm text-slate hover:text-ink">
          ← All modes
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber">
            {meta.tagline}
          </p>
          <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-bold text-teal">
            Multiplayer
          </span>
        </div>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
          {meta.name}
        </h1>
        <p className="mt-4 text-lg text-slate">{meta.blurb}</p>
        <ul className="mt-6 space-y-2 text-sm text-ink/90">
          {mode === "brain" && (
            <>
              <li>• Indian festivals, Bollywood, food, cricket, geography, mythology</li>
              <li>• Speed bonuses for faster correct answers</li>
              <li>• Multiple-choice + riddle rounds</li>
            </>
          )}
          {mode === "chaos" && (
            <>
              <li>• Family-friendly would-you-rathers and creative prompts</li>
              <li>• Anonymous reveals + friendly voting</li>
              <li>• Great for mixed ages around one screen</li>
            </>
          )}
          {mode === "bluff" && (
            <>
              <li>• Secret roles with private clues only you can see</li>
              <li>• Discuss in chat, then vote together</li>
              <li>• Best with 4+ players</li>
            </>
          )}
          {mode === "mind" && (
            <>
              <li>• Same prompt for everyone — no talking about answers</li>
              <li>• Matching answers score points</li>
              <li>• Quick, light rounds for any group</li>
            </>
          )}
          {mode === "dilemma" && (
            <>
              <li>• Two spicy choices — pick a side fast</li>
              <li>• Alternating majority / minority scoring</li>
              <li>• Perfect icebreaker between heavier games</li>
            </>
          )}
          {mode === "geet" && (
            <>
              <li>• Get a letter, drop a song title</li>
              <li>• Anonymous reveal, then vote for the catchiest</li>
              <li>• Antakshari energy without the arguments</li>
            </>
          )}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/setup?mode=${mode}`}
            onClick={() => savePreferredMode(mode)}
          >
            <Button size="lg">Play {meta.name}</Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="ghost">
              Join a room
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
