import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROOM_CODE_LENGTH,
  type AvatarId,
  type GameSettings,
} from "@partyverse/shared";
import { customAlphabet } from "nanoid";
import { config } from "../config";
import { brainController } from "../games/brain";
import { bluffController, getPrivateBluff } from "../games/bluff";
import { beginVotePhase, chaosController } from "../games/chaos";
import { dilemmaController } from "../games/dilemma";
import { geetController } from "../games/geet";
import { mindController } from "../games/mind";
import type { RoomStore } from "./RoomStore";
import { clearTimer, transition } from "./stateMachine";
import type { InternalPlayer, InternalRoom } from "./types";

const codeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", ROOM_CODE_LENGTH);
const idAlphabet = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export class RoomService {
  constructor(private store: RoomStore) {}

  createRoom(nickname: string, avatar: AvatarId, socketId: string) {
    let code = codeAlphabet();
    while (this.store.get(code)) code = codeAlphabet();

    const playerId = idAlphabet();
    const membershipToken = idAlphabet() + idAlphabet();
    const now = Date.now();

    const player: InternalPlayer = {
      id: playerId,
      nickname,
      avatar,
      ready: false,
      connected: true,
      score: 0,
      membershipToken,
      socketId,
      lastSeenAt: now,
    };

    const room: InternalRoom = {
      code,
      state: "WAITING",
      hostId: playerId,
      players: new Map([[playerId, player]]),
      chat: [],
      selectedMode: null,
      settings: null,
      howtoEndsAt: null,
      howtoAcked: new Set(),
      roundIndex: 0,
      totalRounds: 0,
      createdAt: now,
      updatedAt: now,
      timer: null,
      usedQuestionIds: new Set(),
      brainQuestion: null,
      brainCorrectAnswer: null,
      brainExplanation: null,
      brainSubmissions: new Map(),
      brainResult: null,
      chaosPrompt: null,
      chaosSubmissions: new Map(),
      chaosResponses: null,
      chaosResult: null,
      chaosPhase: null,
      bluffScenario: null,
      bluffPrivate: new Map(),
      bluffCulpritId: null,
      bluffVotes: new Map(),
      bluffReady: new Set(),
      bluffReveal: null,
      mindPrompt: null,
      mindSubmissions: new Map(),
      mindResult: null,
      dilemmaPrompt: null,
      dilemmaVotes: new Map(),
      dilemmaResult: null,
      geetPrompt: null,
      geetSubmissions: new Map(),
      geetResponses: null,
      geetResult: null,
      geetPhase: null,
      winnerIds: [],
    };

    this.store.set(room);
    return { room, playerId, membershipToken };
  }

  joinRoom(
    code: string,
    nickname: string,
    avatar: AvatarId,
    socketId: string
  ):
    | { error: "ROOM_NOT_FOUND" | "ROOM_FULL" | "GAME_UNAVAILABLE" | "NICKNAME_TAKEN" }
    | { room: InternalRoom; playerId: string; membershipToken: string } {
    const room = this.store.get(code.toUpperCase());
    if (!room || room.state === "CLOSED") return { error: "ROOM_NOT_FOUND" };
    if (room.players.size >= MAX_PLAYERS) return { error: "ROOM_FULL" };
    if (room.state !== "WAITING" && room.state !== "GAME_SELECTION") {
      return { error: "GAME_UNAVAILABLE" };
    }
    const taken = [...room.players.values()].some(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
    );
    if (taken) return { error: "NICKNAME_TAKEN" };

    const playerId = idAlphabet();
    const membershipToken = idAlphabet() + idAlphabet();
    const now = Date.now();
    room.players.set(playerId, {
      id: playerId,
      nickname,
      avatar,
      ready: false,
      connected: true,
      score: 0,
      membershipToken,
      socketId,
      lastSeenAt: now,
    });
    // If the creator fully left, the next joiner becomes host
    if (!room.players.has(room.hostId)) {
      room.hostId = playerId;
    }
    room.updatedAt = now;
    return { room, playerId, membershipToken };
  }

  reconnect(
    code: string,
    playerId: string,
    membershipToken: string,
    socketId: string
  ):
    | { error: "ROOM_NOT_FOUND" | "UNAUTHORIZED" }
    | {
        room: InternalRoom;
        playerId: string;
        membershipToken: string;
        privateBluff: ReturnType<typeof getPrivateBluff>;
      } {
    const room = this.store.get(code.toUpperCase());
    if (!room || room.state === "CLOSED") return { error: "ROOM_NOT_FOUND" };
    const player = room.players.get(playerId);
    if (!player || player.membershipToken !== membershipToken) {
      return { error: "UNAUTHORIZED" };
    }
    player.connected = true;
    player.socketId = socketId;
    player.lastSeenAt = Date.now();
    room.updatedAt = Date.now();
    return {
      room,
      playerId,
      membershipToken,
      privateBluff: getPrivateBluff(room, playerId),
    };
  }

  leave(
    code: string,
    playerId: string,
    opts: { permanent?: boolean } = {}
  ) {
    const permanent = opts.permanent ?? false;
    const room = this.store.get(code);
    if (!room) return null;
    const player = room.players.get(playerId);
    if (!player) return room;
    const alreadyLeft = !player.connected;
    const nickname = player.nickname;

    if (permanent) {
      room.players.delete(playerId);
    } else {
      player.connected = false;
      player.socketId = null;
      player.lastSeenAt = Date.now();
    }

    if (!alreadyLeft) {
      room.chat.push({
        id: idAlphabet(),
        playerId: "system",
        nickname: "PartyVerse",
        text: permanent
          ? `${nickname} left the game`
          : `${nickname} stepped away`,
        createdAt: Date.now(),
      });
      if (room.chat.length > 100) room.chat = room.chat.slice(-100);
    }

    if (room.hostId === playerId) {
      const next = [...room.players.values()].find(
        (p) => p.connected && p.id !== playerId
      );
      if (next) room.hostId = next.id;
    }

    // Keep the room either way (stay in lobby or leave) so invite links still work.
    // cleanupIdle removes abandoned rooms after disconnectGraceMs / idle TTL.
    if (room.state === "CLOSED") {
      room.state = "WAITING";
    }
    room.updatedAt = Date.now();
    return room;
  }

  setReady(room: InternalRoom, playerId: string, ready: boolean) {
    const player = room.players.get(playerId);
    if (!player) return;
    if (room.state !== "WAITING" && room.state !== "GAME_SELECTION") return;
    player.ready = ready;
    room.updatedAt = Date.now();
  }

  transferHost(
    room: InternalRoom,
    hostId: string,
    targetPlayerId: string
  ): { error: "UNAUTHORIZED" | "INVALID_TARGET" } | { ok: true } {
    if (room.hostId !== hostId) return { error: "UNAUTHORIZED" };
    const target = room.players.get(targetPlayerId);
    if (!target || !target.connected || targetPlayerId === hostId) {
      return { error: "INVALID_TARGET" };
    }
    room.hostId = targetPlayerId;
    room.updatedAt = Date.now();
    room.chat.push({
      id: idAlphabet(),
      playerId: "system",
      nickname: "PartyVerse",
      text: `${target.nickname} is now the host`,
      createdAt: Date.now(),
    });
    if (room.chat.length > 100) room.chat = room.chat.slice(-100);
    return { ok: true };
  }

  selectGame(
    room: InternalRoom,
    hostId: string,
    settings: GameSettings
  ): { error: "UNAUTHORIZED" | "INVALID_STATE" | "MIN_PLAYERS" } | { ok: true } {
    if (room.hostId !== hostId) return { error: "UNAUTHORIZED" };
    if (room.state !== "WAITING" && room.state !== "GAME_SELECTION" && room.state !== "GAME_RESULTS") {
      return { error: "INVALID_STATE" };
    }
    if (settings.mode === "bluff" && room.players.size < MIN_PLAYERS) {
      return { error: "MIN_PLAYERS" };
    }
    room.selectedMode = settings.mode;
    room.settings = settings;
    if (room.state === "WAITING" || room.state === "GAME_RESULTS") {
      transition(room, "GAME_SELECTION");
    }
    return { ok: true };
  }

  async startGame(
    room: InternalRoom,
    hostId: string,
    broadcast: (r: InternalRoom) => void,
    sendPrivate: (playerId: string, payload: unknown) => void
  ): Promise<
    | {
        error: "UNAUTHORIZED" | "INVALID_STATE" | "MIN_PLAYERS" | "NOT_READY";
        notReadyNames?: string[];
      }
    | { ok: true }
  > {
    if (room.hostId !== hostId) return { error: "UNAUTHORIZED" };
    if (room.state !== "GAME_SELECTION" && room.state !== "WAITING") {
      return { error: "INVALID_STATE" };
    }
    if (!room.settings || !room.selectedMode) {
      return { error: "INVALID_STATE" };
    }
    const connected = [...room.players.values()].filter((p) => p.connected);
    if (connected.length < MIN_PLAYERS) return { error: "MIN_PLAYERS" };

    const notReady = connected.filter((p) => !p.ready);
    if (notReady.length > 0) {
      return {
        error: "NOT_READY",
        notReadyNames: notReady.map((p) => p.nickname),
      };
    }

    for (const p of room.players.values()) {
      p.score = 0;
      p.ready = false;
    }
    room.roundIndex = 0;
    room.winnerIds = [];
    room.brainResult = null;
    room.chaosResult = null;
    room.bluffReveal = null;
    room.mindResult = null;
    room.dilemmaResult = null;
    room.geetResult = null;

    if (room.settings.mode === "brain") {
      room.totalRounds = room.settings.brain.rounds;
    } else if (room.settings.mode === "chaos") {
      room.totalRounds = room.settings.chaos.rounds;
    } else if (room.settings.mode === "mind") {
      room.totalRounds = room.settings.mind.rounds;
    } else if (room.settings.mode === "dilemma") {
      room.totalRounds = room.settings.dilemma.rounds;
    } else if (room.settings.mode === "geet") {
      room.totalRounds = room.settings.geet.rounds;
    } else {
      room.totalRounds = 1;
    }

    // Shared how-to briefing before first round
    room.howtoAcked = new Set();
    room.howtoEndsAt = Date.now() + 30_000;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    clearTimer(room);
    room.timer = setTimeout(() => {
      void this.beginGameplay(room, broadcast, sendPrivate);
    }, 30_000);

    return { ok: true };
  }

  ackHowto(
    room: InternalRoom,
    playerId: string,
    broadcast: (r: InternalRoom) => void,
    sendPrivate: (playerId: string, payload: unknown) => void
  ): { error: "INVALID_STATE" } | { ok: true; started: boolean } {
    if (!room.howtoEndsAt || room.state !== "PREPARING_ROUND") {
      return { error: "INVALID_STATE" };
    }
    room.howtoAcked.add(playerId);
    room.updatedAt = Date.now();
    const connected = [...room.players.values()].filter((p) => p.connected);
    const allAcked =
      connected.length > 0 &&
      connected.every((p) => room.howtoAcked.has(p.id));
    broadcast(room);
    if (allAcked) {
      clearTimer(room);
      void this.beginGameplay(room, broadcast, sendPrivate);
      return { ok: true, started: true };
    }
    return { ok: true, started: false };
  }

  private async beginGameplay(
    room: InternalRoom,
    broadcast: (r: InternalRoom) => void,
    sendPrivate: (playerId: string, payload: unknown) => void
  ) {
    if (!room.settings || !room.selectedMode) return;
    // Only start once from howto (timer or unanimous ack)
    if (!room.howtoEndsAt || room.state !== "PREPARING_ROUND") return;
    room.howtoEndsAt = null;
    room.howtoAcked = new Set();
    clearTimer(room);

    if (room.settings.mode === "brain") {
      await brainController.startRound(room, broadcast);
    } else if (room.settings.mode === "chaos") {
      await chaosController.startRound(room, broadcast);
    } else if (room.settings.mode === "mind") {
      await mindController.startRound(room, broadcast);
    } else if (room.settings.mode === "dilemma") {
      await dilemmaController.startRound(room, broadcast);
    } else if (room.settings.mode === "geet") {
      await geetController.startRound(room, broadcast);
    } else {
      await bluffController.startRound(room, broadcast);
      for (const player of room.players.values()) {
        const info = getPrivateBluff(room, player.id);
        if (info) sendPrivate(player.id, info);
      }
    }
  }

  private resetGameplay(room: InternalRoom) {
    clearTimer(room);
    for (const p of room.players.values()) {
      p.ready = false;
      p.score = 0;
    }
    room.selectedMode = null;
    room.settings = null;
    room.howtoEndsAt = null;
    room.howtoAcked = new Set();
    room.roundIndex = 0;
    room.totalRounds = 0;
    room.brainQuestion = null;
    room.brainCorrectAnswer = null;
    room.brainExplanation = null;
    room.brainSubmissions = new Map();
    room.brainResult = null;
    room.chaosPrompt = null;
    room.chaosResult = null;
    room.chaosResponses = null;
    room.chaosSubmissions = new Map();
    room.chaosPhase = null;
    room.bluffScenario = null;
    room.bluffReveal = null;
    room.bluffPrivate = new Map();
    room.bluffVotes = new Map();
    room.bluffReady = new Set();
    room.bluffCulpritId = null;
    room.mindPrompt = null;
    room.mindResult = null;
    room.mindSubmissions = new Map();
    room.dilemmaPrompt = null;
    room.dilemmaVotes = new Map();
    room.dilemmaResult = null;
    room.geetPrompt = null;
    room.geetSubmissions = new Map();
    room.geetResponses = null;
    room.geetResult = null;
    room.geetPhase = null;
    room.winnerIds = [];
  }

  playAgain(
    room: InternalRoom,
    hostId: string
  ): { error: "UNAUTHORIZED" | "INVALID_STATE" } | { ok: true } {
    if (room.hostId !== hostId) return { error: "UNAUTHORIZED" };
    if (room.state !== "GAME_RESULTS") return { error: "INVALID_STATE" };
    this.resetGameplay(room);
    transition(room, "WAITING");
    return { ok: true };
  }

  /** Host can leave mid-game and pick another mode immediately. */
  abortToLobby(
    room: InternalRoom,
    hostId: string
  ): { error: "UNAUTHORIZED" | "INVALID_STATE" } | { ok: true } {
    if (room.hostId !== hostId) return { error: "UNAUTHORIZED" };
    const abortable = new Set([
      "GAME_SELECTION",
      "PREPARING_ROUND",
      "IN_PROGRESS",
      "ROUND_RESULTS",
      "GAME_RESULTS",
    ]);
    if (!abortable.has(room.state)) return { error: "INVALID_STATE" };
    this.resetGameplay(room);
    transition(room, "WAITING");
    return { ok: true };
  }

  addChat(room: InternalRoom, playerId: string, text: string) {
    const player = room.players.get(playerId);
    if (!player) return null;
    const message = {
      id: idAlphabet(),
      playerId,
      nickname: player.nickname,
      text,
      createdAt: Date.now(),
    };
    room.chat.push(message);
    if (room.chat.length > 100) room.chat = room.chat.slice(-100);
    room.updatedAt = Date.now();
    return message;
  }

  cleanupIdle() {
    const now = Date.now();
    for (const room of this.store.values()) {
      const idle = now - room.updatedAt > config.roomIdleTtlMs;
      const players = [...room.players.values()];
      const noneConnected =
        players.length === 0 || !players.some((p) => p.connected);
      const lastSeen = players.reduce(
        (max, p) => Math.max(max, p.lastSeenAt),
        room.updatedAt
      );
      // Empty / everyone gone: keep for grace so shared invite links still work
      const graceExpired =
        noneConnected && now - lastSeen > config.disconnectGraceMs;
      if (idle || graceExpired) {
        clearTimer(room);
        this.store.delete(room.code);
      }
    }
  }
}

// re-export helpers used by handlers
export {
  brainController,
  chaosController,
  bluffController,
  mindController,
  dilemmaController,
  geetController,
  beginVotePhase,
};
