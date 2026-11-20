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
      bluffReveal: null,
      mindPrompt: null,
      mindSubmissions: new Map(),
      mindResult: null,
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

  leave(code: string, playerId: string) {
    const room = this.store.get(code);
    if (!room) return null;
    const player = room.players.get(playerId);
    if (!player) return room;
    const alreadyLeft = !player.connected;
    player.connected = false;
    player.socketId = null;
    player.lastSeenAt = Date.now();

    if (!alreadyLeft) {
      room.chat.push({
        id: idAlphabet(),
        playerId: "system",
        nickname: "PartyVerse",
        text: `${player.nickname} left the game`,
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

    const anyConnected = [...room.players.values()].some((p) => p.connected);
    if (!anyConnected) {
      clearTimer(room);
      room.state = "CLOSED";
      this.store.delete(room.code);
      return null;
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
  ): Promise<{ error: "UNAUTHORIZED" | "INVALID_STATE" | "MIN_PLAYERS" } | { ok: true }> {
    if (room.hostId !== hostId) return { error: "UNAUTHORIZED" };
    if (room.state !== "GAME_SELECTION" && room.state !== "WAITING") {
      return { error: "INVALID_STATE" };
    }
    if (!room.settings || !room.selectedMode) {
      return { error: "INVALID_STATE" };
    }
    const connected = [...room.players.values()].filter((p) => p.connected);
    const practice =
      (room.settings.mode === "brain" && room.settings.brain.practice) ||
      (room.settings.mode === "mind" && room.settings.mind.practice);
    const minNeeded = practice ? 1 : MIN_PLAYERS;
    if (connected.length < minNeeded) return { error: "MIN_PLAYERS" };

    for (const p of room.players.values()) {
      p.score = 0;
      p.ready = false;
    }
    room.roundIndex = 0;
    room.winnerIds = [];
    room.usedQuestionIds = new Set();
    room.brainResult = null;
    room.chaosResult = null;
    room.bluffReveal = null;
    room.mindResult = null;

    if (room.settings.mode === "brain") {
      room.totalRounds = practice
        ? Math.min(5, room.settings.brain.rounds)
        : room.settings.brain.rounds;
      await brainController.startRound(room, broadcast);
    } else if (room.settings.mode === "chaos") {
      room.totalRounds = room.settings.chaos.rounds;
      await chaosController.startRound(room, broadcast);
    } else if (room.settings.mode === "mind") {
      room.totalRounds = practice
        ? Math.min(5, room.settings.mind.rounds)
        : room.settings.mind.rounds;
      await mindController.startRound(room, broadcast);
    } else {
      room.totalRounds = 1;
      await bluffController.startRound(room, broadcast);
      for (const player of room.players.values()) {
        const info = getPrivateBluff(room, player.id);
        if (info) sendPrivate(player.id, info);
      }
    }
    return { ok: true };
  }

  private resetGameplay(room: InternalRoom) {
    clearTimer(room);
    for (const p of room.players.values()) {
      p.ready = false;
      p.score = 0;
    }
    room.selectedMode = null;
    room.settings = null;
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
    room.bluffCulpritId = null;
    room.mindPrompt = null;
    room.mindResult = null;
    room.mindSubmissions = new Map();
    room.usedQuestionIds = new Set();
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
      const noneConnected = ![...room.players.values()].some((p) => p.connected);
      if (idle || noneConnected) {
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
  beginVotePhase,
};
