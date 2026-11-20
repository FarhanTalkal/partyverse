"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { roomCodeSchema } from "@partyverse/shared";
import { Button } from "@/components/ui/Button";
import { ConnectionPill } from "@/components/ui/ConnectionPill";
import { Input } from "@/components/ui/Input";
import { useGameSocket } from "@/hooks/useGameSocket";
import { loadProfile } from "@/lib/session";

function JoinInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { joinRoom, connectionStatus, retryConnect, error } = useGameSocket();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadProfile()) {
      const c = search.get("code");
      router.replace(c ? `/setup?code=${c}` : "/setup");
      return;
    }
    const prefill = search.get("code");
    if (prefill) setCode(prefill.toUpperCase());
  }, [router, search]);

  async function onJoin() {
    const profile = loadProfile();
    if (!profile) {
      router.replace("/setup");
      return;
    }
    const parsed = roomCodeSchema.safeParse(code);
    if (!parsed.success) {
      setLocalError("Enter a valid 6-character room code");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const res = await joinRoom(parsed.data, profile.nickname, profile.avatar);
      router.replace(`/room/${res.room.code}`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not join room");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-lg rounded-[1.75rem] pv-card p-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/setup" className="text-sm text-slate hover:text-ink">
            ← Back
          </Link>
          <ConnectionPill status={connectionStatus} onRetry={retryConnect} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink">
          Join a room
        </h1>
        <p className="mt-3 text-slate">Enter the code your host shared.</p>
        <label className="mt-8 block">
          <span className="mb-2 block text-sm font-semibold text-ink">
            Room code
          </span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="tracking-[0.3em]"
          />
        </label>
        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={busy || connectionStatus === "offline"}
          onClick={onJoin}
        >
          {busy
            ? "Joining…"
            : connectionStatus === "connecting"
              ? "Connecting…"
              : "Join room"}
        </Button>
        {(localError || error) && (
          <p className="mt-3 text-sm text-coral">{localError || error}</p>
        )}
        {connectionStatus === "offline" && (
          <p className="mt-3 text-sm text-coral">
            Can&apos;t reach the game server.{" "}
            <button type="button" className="underline" onClick={retryConnect}>
              Retry
            </button>
          </p>
        )}
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center text-ink">
          Loading…
        </main>
      }
    >
      <JoinInner />
    </Suspense>
  );
}
