"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  GAME_MODE_META,
  GAME_MODES,
  MIN_PLAYERS,
  SOCKET_EVENTS,
} from "@partyverse/shared";
import { ChatPanel } from "@/components/lobby/ChatPanel";
import { GameSelect } from "@/components/lobby/GameSelect";
import { PlayerList } from "@/components/lobby/PlayerList";
import { GameResults } from "@/components/game/GameResults";
import { BrainBattle } from "@/components/modes/brain/BrainBattle";
import { ChaosChallenge } from "@/components/modes/chaos/ChaosChallenge";
import { BluffBetray } from "@/components/modes/bluff/BluffBetray";
import { MindMatch } from "@/components/modes/mind/MindMatch";
import { Button } from "@/components/ui/Button";
import { ConnectionPill } from "@/components/ui/ConnectionPill";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useGameSocket } from "@/hooks/useGameSocket";
import { defaultSettingsFor, inviteUrl, loadPreferredMode } from "@/lib/modes";
import { loadMembership } from "@/lib/session";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const {
    room,
    playerId,
    connectionStatus,
    reconnecting,
    error,
    privateBluff,
    emit,
    leaveRoom,
    retryReconnect,
    retryConnect,
    createRoom,
  } = useGameSocket();

  const code = (params.code || "").toUpperCase();
  const preferredMode = useMemo(() => loadPreferredMode(), []);
  const membership = useMemo(() => loadMembership(), []);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const self = useMemo(
    () => room?.players.find((p) => p.id === playerId),
    [room, playerId]
  );
  const isHost = self?.isHost ?? false;

  if (reconnecting && !room) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="rounded-[1.5rem] pv-card p-8 text-center">
          <p className="font-display text-2xl font-bold text-ink">
            Reconnecting…
          </p>
          <p className="mt-2 text-slate">Restoring your seat in the room.</p>
          <div className="mt-4 flex justify-center">
            <ConnectionPill status={connectionStatus} onRetry={retryConnect} />
          </div>
        </div>
      </main>
    );
  }

  if (!room) {
    const hasMembership =
      membership && membership.code.toUpperCase() === code;

    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md rounded-[1.5rem] pv-card p-8 text-center">
          <p className="font-display text-2xl font-bold text-ink">
            {hasMembership ? "Couldn't restore your seat" : "Room unavailable"}
          </p>
          <p className="mt-2 text-slate">
            {error ||
              (hasMembership
                ? `Room ${code} may still be open. Retry reconnect, or start fresh.`
                : `We couldn't find an active seat in room ${code}.`)}
          </p>
          <div className="mt-4 flex justify-center">
            <ConnectionPill status={connectionStatus} onRetry={retryConnect} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {hasMembership && (
              <Button
                disabled={retrying}
                onClick={async () => {
                  setRetrying(true);
                  const ok = await retryReconnect();
                  setRetrying(false);
                  if (!ok) {
                    /* error already set on provider */
                  }
                }}
              >
                {retrying ? "Retrying…" : "Retry reconnect"}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={async () => {
                const profile = JSON.parse(
                  localStorage.getItem("partyverse.profile") || "null"
                );
                if (!profile) {
                  router.push("/setup");
                  return;
                }
                try {
                  leaveRoom();
                  const res = await createRoom(
                    profile.nickname,
                    profile.avatar
                  );
                  router.replace(`/room/${res.room.code}`);
                } catch {
                  router.push("/setup");
                }
              }}
            >
              Create new room
            </Button>
            <Link href="/join">
              <Button variant="ghost">Join room</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const inLobby = room.state === "WAITING" || room.state === "GAME_SELECTION";
  const inGame = ["PREPARING_ROUND", "IN_PROGRESS", "ROUND_RESULTS"].includes(
    room.state
  );
  const canSwitch =
    isHost &&
    [
      "GAME_SELECTION",
      "PREPARING_ROUND",
      "IN_PROGRESS",
      "ROUND_RESULTS",
      "GAME_RESULTS",
    ].includes(room.state);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room!.code);
      setCopied("code");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl(room!.code));
      setCopied("link");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  function switchMode() {
    emit(SOCKET_EVENTS.GAME_ABORT);
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="font-display text-xl font-bold text-ink">
              PartyVerse
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate">
              <span className="font-semibold tracking-widest text-ink text-lg">
                {room.code}
              </span>
              <Button size="sm" variant="ghost" onClick={copyCode}>
                {copied === "code" ? "Copied" : "Copy code"}
              </Button>
              <Button size="sm" variant="ghost" onClick={copyLink}>
                {copied === "link" ? "Link copied" : "Copy invite link"}
              </Button>
              <ConnectionPill status={connectionStatus} onRetry={retryConnect} />
            </div>
            {isHost && inLobby && (
              <p className="mt-2 text-xs text-slate">
                Send the invite link to friends on WhatsApp / Messages.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            {canSwitch && (
              <Button size="sm" variant="secondary" onClick={switchMode}>
                Switch mode
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                leaveRoom();
                router.push("/");
              }}
            >
              Leave
            </Button>
          </div>
        </header>

        {error && (
          <p className="mb-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        )}

        {room.state === "GAME_RESULTS" && (
          <div className="space-y-4">
            {room.selectedMode === "bluff" && room.bluffReveal ? (
              <BluffBetray
                room={room}
                playerId={playerId}
                privateInfo={privateBluff}
                emit={emit}
              />
            ) : null}
            <GameResults
              room={room}
              isHost={isHost}
              onPlayAgain={() => emit(SOCKET_EVENTS.GAME_PLAY_AGAIN)}
              onBackToLobby={switchMode}
            />
          </div>
        )}

        {(inLobby || inGame) && (
          <div
            className={
              inLobby
                ? "grid gap-5 lg:grid-cols-[0.9fr_1.2fr_0.9fr]"
                : "grid gap-5 lg:grid-cols-[1.4fr_0.8fr]"
            }
          >
            {inLobby && (
              <section className="rounded-[1.5rem] pv-card p-4">
                <h2 className="mb-3 font-display text-xl font-bold text-ink">
                  Players
                </h2>
                <PlayerList players={room.players} selfId={playerId} />
                <Button
                  className="mt-4 w-full"
                  variant={self?.ready ? "secondary" : "primary"}
                  onClick={() =>
                    emit(SOCKET_EVENTS.PLAYER_READY, { ready: !self?.ready })
                  }
                >
                  {self?.ready ? "Unready" : "Ready up"}
                </Button>
              </section>
            )}

            <section className="space-y-4">
              {inLobby && (
                <>
                  <div className="rounded-[1.5rem] pv-card p-5">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                      Lobby
                    </h2>
                    <p className="mt-2 text-slate">
                      {room.players.length}/8 players · need at least {MIN_PLAYERS}{" "}
                      for multiplayer (or Practice solo)
                    </p>
                  </div>
                  {isHost ? (
                    <GameSelect
                      playerCount={room.players.length}
                      selectedMode={room.selectedMode}
                      preferredMode={preferredMode}
                      onSelect={(payload) =>
                        emit(SOCKET_EVENTS.GAME_SELECT, payload)
                      }
                      onStart={() => emit(SOCKET_EVENTS.GAME_START)}
                      onPractice={(mode) => {
                        emit(
                          SOCKET_EVENTS.GAME_SELECT,
                          defaultSettingsFor(mode, true)
                        );
                        setTimeout(
                          () => emit(SOCKET_EVENTS.GAME_START),
                          80
                        );
                      }}
                      disabled={
                        room.players.filter((p) => p.connected).length <
                        MIN_PLAYERS
                      }
                    />
                  ) : (
                    <div className="rounded-[1.5rem] pv-card p-5">
                      <p className="font-semibold text-ink">Waiting for host</p>
                      <p className="mt-1 text-sm text-slate">
                        {room.selectedMode
                          ? `Selected: ${GAME_MODE_META[room.selectedMode].name}`
                          : "The host will pick a mode soon."}
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {GAME_MODES.map((m) => (
                          <div
                            key={m}
                            className="rounded-xl bg-[var(--surface-strong)] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">
                                {GAME_MODE_META[m].name}
                              </p>
                              {(m === "brain" || m === "mind") && (
                                <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                                  Solo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate">
                              {GAME_MODE_META[m].tagline}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {inGame && isHost && (
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={switchMode}>
                    End game & switch mode
                  </Button>
                </div>
              )}

              {inGame && room.selectedMode === "brain" && (
                <BrainBattle room={room} emit={emit} />
              )}
              {inGame && room.selectedMode === "chaos" && (
                <ChaosChallenge room={room} playerId={playerId} emit={emit} />
              )}
              {inGame && room.selectedMode === "bluff" && (
                <BluffBetray
                  room={room}
                  playerId={playerId}
                  privateInfo={privateBluff}
                  emit={emit}
                />
              )}
              {inGame && room.selectedMode === "mind" && (
                <MindMatch room={room} emit={emit} />
              )}
            </section>

            <aside className="space-y-4">
              {inGame && (
                <div className="rounded-[1.5rem] pv-card p-4">
                  <h3 className="mb-3 font-semibold text-ink">Live scores</h3>
                  <PlayerList
                    players={[...room.players].sort((a, b) => b.score - a.score)}
                    selfId={playerId}
                  />
                </div>
              )}
              <ChatPanel
                messages={room.chat}
                onSend={(text) => emit(SOCKET_EVENTS.CHAT_SEND, { text })}
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
