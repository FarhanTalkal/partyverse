"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  GAME_MODE_META,
  GAME_MODES,
  nicknameSchema,
  roomCodeSchema,
  type AvatarId,
  type GameMode,
} from "@partyverse/shared";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Button } from "@/components/ui/Button";
import { ConnectionPill } from "@/components/ui/ConnectionPill";
import { Input } from "@/components/ui/Input";
import { MusicToggle } from "@/components/ui/MusicProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useGameSocket } from "@/hooks/useGameSocket";
import { loadProfile, saveProfile } from "@/lib/session";
import { savePreferredMode } from "@/lib/modes";

function SetupInner() {
  const router = useRouter();
  const search = useSearchParams();
  const modeParam = search.get("mode");
  const joinCode = search.get("code")?.trim().toUpperCase() || null;
  const inviteJoin = Boolean(joinCode);
  const preferred =
    modeParam && GAME_MODES.includes(modeParam as GameMode)
      ? (modeParam as GameMode)
      : null;

  const { createRoom, joinRoom, connectionStatus, retryConnect } = useGameSocket();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarId | null>(inviteJoin ? null : "cat");
  const [code, setCode] = useState(joinCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    // Never prefill nickname — always type fresh (placeholder guides the user)
    setNickname("");
    if (inviteJoin) {
      setAvatar(null);
    } else if (profile?.avatar) {
      setAvatar(profile.avatar);
    }
    if (joinCode) setCode(joinCode);
    if (preferred) savePreferredMode(preferred);
  }, [preferred, joinCode, inviteJoin]);

  function validate() {
    const parsed = nicknameSchema.safeParse(nickname);
    if (!parsed.success) {
      setError("Nickname must be 2–16 letters, numbers, spaces, - or _");
      return null;
    }
    if (!avatar) {
      setError("Pick an avatar to continue");
      return null;
    }
    saveProfile({ nickname: parsed.data, avatar });
    if (preferred) savePreferredMode(preferred);
    return { name: parsed.data, avatar };
  }

  async function onCreate() {
    const valid = validate();
    if (!valid) return;
    setBusy("create");
    setError(null);
    try {
      const res = await createRoom(valid.name, valid.avatar);
      router.replace(`/room/${res.room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create room");
      setBusy(null);
    }
  }

  async function onJoinDirect() {
    const valid = validate();
    if (!valid) return;
    const parsed = roomCodeSchema.safeParse(code);
    if (!parsed.success) {
      setError("Enter a valid 6-character room code");
      return;
    }
    setBusy("join");
    setError(null);
    try {
      const res = await joinRoom(parsed.data, valid.name, valid.avatar);
      router.replace(`/room/${res.room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join room");
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-display text-xl font-bold text-ink">
            PartyVerse
          </Link>
          <div className="flex items-center gap-2">
            <MusicToggle />
            <ThemeToggle />
            <ConnectionPill status={connectionStatus} onRetry={retryConnect} />
          </div>
        </div>
        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight text-ink">
          {inviteJoin ? "You're invited" : "Who's playing tonight?"}
        </h1>
        {preferred && (
          <p className="mt-3 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink">
            Starting with <strong>{GAME_MODE_META[preferred].name}</strong> — you can
            still switch modes in the lobby.
          </p>
        )}
        <p className="mt-3 text-slate">
          {inviteJoin
            ? "Choose your nickname and avatar, then join."
            : "Pick a nickname and avatar, then create or join a room."}
        </p>

        <div className="mt-8 space-y-6 rounded-[1.75rem] pv-card p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">
              Nickname
            </span>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Type your name here"
              maxLength={16}
              autoFocus
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-semibold text-ink">
              Avatar{inviteJoin ? " — pick one" : ""}
            </span>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <span className="mb-2 block text-sm font-semibold text-ink">
              {inviteJoin ? "Room code" : "Join room directly"}
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={code}
                onChange={(e) => {
                  if (!inviteJoin) setCode(e.target.value.toUpperCase());
                }}
                placeholder="ABC123"
                maxLength={6}
                className="tracking-[0.28em] sm:flex-1"
                readOnly={inviteJoin}
                aria-readonly={inviteJoin}
              />
              <Button
                className={`shrink-0 whitespace-nowrap ${inviteJoin ? "sm:flex-1" : ""}`}
                variant={inviteJoin ? "primary" : "secondary"}
                disabled={busy !== null || connectionStatus === "offline"}
                onClick={onJoinDirect}
              >
                {busy === "join" ? "Joining…" : "Join now"}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          {!inviteJoin && (
            <Button
              className="w-full"
              disabled={busy !== null || connectionStatus === "offline"}
              onClick={onCreate}
            >
              {busy === "create"
                ? "Creating…"
                : connectionStatus === "connecting"
                  ? "Connecting…"
                  : "Create room"}
            </Button>
          )}
          {connectionStatus === "offline" && (
            <p className="text-sm text-coral">
              Can&apos;t reach the game server.{" "}
              <button
                type="button"
                className="underline"
                onClick={retryConnect}
              >
                Retry
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center text-ink">
          Loading…
        </main>
      }
    >
      <SetupInner />
    </Suspense>
  );
}
