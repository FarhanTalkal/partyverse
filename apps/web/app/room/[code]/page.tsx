"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { MusicToggle, useMusic } from "@/components/ui/MusicProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useGameSocket } from "@/hooks/useGameSocket";
import { defaultSettingsFor, inviteUrl, loadPreferredMode } from "@/lib/modes";
import { loadMembership, loadProfile } from "@/lib/session";

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
    chatNotice,
    clearChatNotice,
    emit,
    leaveRoom,
    retryReconnect,
    retryConnect,
    createRoom,
    joinRoom,
  } = useGameSocket();
  const { setMode: setMusicMode } = useMusic();

  const code = (params.code || "").toUpperCase();
  const preferredMode = useMemo(() => loadPreferredMode(), []);
  const membership = useMemo(() => loadMembership(), []);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [rejoining, setRejoining] = useState(false);

  const self = useMemo(
    () => room?.players.find((p) => p.id === playerId),
    [room, playerId]
  );
  const isHost = self?.isHost ?? false;
  const inGameEarly = room
    ? ["PREPARING_ROUND", "IN_PROGRESS", "ROUND_RESULTS"].includes(room.state)
    : false;

  useEffect(() => {
    setMusicMode(inGameEarly ? "game" : "lobby");
  }, [inGameEarly, setMusicMode]);

  async function rejoinSeat() {
    setRejoining(true);
    try {
      const ok = await retryReconnect();
      if (ok) return;
      const profile = loadProfile();
      if (!profile) {
        router.push(`/setup?code=${code}`);
        return;
      }
      const res = await joinRoom(code, profile.nickname, profile.avatar);
      router.replace(`/room/${res.room.code}`);
    } catch {
      router.push(`/setup?code=${code}`);
    } finally {
      setRejoining(false);
    }
  }

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
            <Button
              variant="secondary"
              disabled={rejoining}
              onClick={() => void rejoinSeat()}
            >
              {rejoining ? "Rejoining…" : "Rejoin this room"}
            </Button>
            <Link href={`/setup?code=${code}`}>
              <Button variant="ghost">Join with new name</Button>
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
      setShareHint("Link copied — switch to WhatsApp, paste, then come back here.");
      setTimeout(() => {
        setCopied(null);
        setShareHint(null);
      }, 4000);
    } catch {
      // ignore
    }
  }

  async function shareInvite() {
    const url = inviteUrl(room!.code);
    const text = `Join my PartyVerse room ${room!.code}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "PartyVerse", text, url });
        setShareHint("Invite sent — stay on this page while friends join.");
        setTimeout(() => setShareHint(null), 4000);
        return;
      }
    } catch {
      // user cancelled or share failed — fall through to copy
    }
    await copyLink();
  }

  function shareWhatsApp() {
    const url = inviteUrl(room!.code);
    const text = encodeURIComponent(
      `Join my PartyVerse room ${room!.code}: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    setShareHint("WhatsApp opened — send the message, then return to this tab.");
    setTimeout(() => setShareHint(null), 5000);
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
              <ConnectionPill status={connectionStatus} onRetry={retryConnect} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MusicToggle />
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

        {chatNotice && (
          <button
            type="button"
            onClick={clearChatNotice}
            className="mb-4 w-full rounded-2xl border border-teal/40 bg-teal/15 px-4 py-3 text-left text-sm text-ink shadow-soft"
          >
            <span className="font-bold text-teal">New message · </span>
            {chatNotice}
          </button>
        )}

        {error && (
          <p className="mb-4 rounded-2xl bg-coral/15 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        )}

        {self && !self.connected && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink">
            <span>You look away from the room — tap rejoin to restore your seat.</span>
            <Button size="sm" disabled={rejoining} onClick={() => void rejoinSeat()}>
              {rejoining ? "Rejoining…" : "Rejoin"}
            </Button>
          </div>
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
                <PlayerList
                  players={room.players}
                  selfId={playerId}
                  isHost={isHost}
                  onMakeHost={(id) =>
                    emit(SOCKET_EVENTS.HOST_TRANSFER, { targetPlayerId: id })
                  }
                  onRejoin={() => void rejoinSeat()}
                />
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
                      {room.players.length}/8 players
                      {room.players.filter((p) => p.connected).length < MIN_PLAYERS
                        ? ` · need at least ${MIN_PLAYERS} to start a group game`
                        : " · group ready"}
                    </p>
                  </div>
                  {isHost && (
                    <div className="rounded-[1.5rem] border border-coral/30 bg-coral/5 p-5">
                      <h3 className="font-display text-lg font-bold text-ink">
                        Invite friends
                      </h3>
                      <p className="mt-1 text-sm text-slate">
                        Share the link — you can stay here or leave. The room stays
                        open so friends can still join.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={shareInvite}>
                          Share invite
                        </Button>
                        <Button size="sm" variant="secondary" onClick={shareWhatsApp}>
                          WhatsApp
                        </Button>
                        <Button size="sm" variant="ghost" onClick={copyLink}>
                          {copied === "link" ? "Link copied" : "Copy link"}
                        </Button>
                      </div>
                      {shareHint && (
                        <p className="mt-3 text-sm text-ink">{shareHint}</p>
                      )}
                    </div>
                  )}
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
                            <p className="text-sm font-semibold text-ink">
                              {GAME_MODE_META[m].name}
                            </p>
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
                    isHost={isHost}
                    onMakeHost={(id) =>
                      emit(SOCKET_EVENTS.HOST_TRANSFER, { targetPlayerId: id })
                    }
                    onRejoin={() => void rejoinSeat()}
                  />
                </div>
              )}
              {!(
                room.selectedMode === "bluff" &&
                room.bluffScenario?.phase === "discussion"
              ) && (
                <ChatPanel
                  messages={room.chat}
                  onSend={(text) => emit(SOCKET_EVENTS.CHAT_SEND, { text })}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
