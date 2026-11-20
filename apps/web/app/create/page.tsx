"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConnectionPill } from "@/components/ui/ConnectionPill";
import { useGameSocket } from "@/hooks/useGameSocket";
import { loadProfile } from "@/lib/session";

/** Thin redirect helper — auto-creates if profile exists. Prefer Setup → Create. */
export default function CreatePage() {
  const router = useRouter();
  const { createRoom, connectionStatus, retryConnect, room } = useGameSocket();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!loadProfile()) {
      router.replace("/setup");
      return;
    }
    if (room) {
      router.replace(`/room/${room.code}`);
      return;
    }
    if (started.current) return;
    if (connectionStatus === "offline") return;
    if (connectionStatus !== "connected" && connectionStatus !== "connecting") {
      return;
    }

    started.current = true;
    const profile = loadProfile()!;
    void createRoom(profile.nickname, profile.avatar)
      .then((res) => router.replace(`/room/${res.room.code}`))
      .catch((e) => {
        started.current = false;
        setError(e instanceof Error ? e.message : "Could not create room");
      });
  }, [connectionStatus, createRoom, room, router]);

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
          Creating your room…
        </h1>
        <p className="mt-3 text-slate">
          Hang tight — you&apos;ll land in the lobby with a shareable code.
        </p>
        {error && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-coral">{error}</p>
            <Button
              onClick={() => {
                started.current = false;
                setError(null);
                retryConnect();
                const profile = loadProfile();
                if (!profile) {
                  router.replace("/setup");
                  return;
                }
                started.current = true;
                void createRoom(profile.nickname, profile.avatar)
                  .then((res) => router.replace(`/room/${res.room.code}`))
                  .catch((e) => {
                    started.current = false;
                    setError(
                      e instanceof Error ? e.message : "Could not create room"
                    );
                  });
              }}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
