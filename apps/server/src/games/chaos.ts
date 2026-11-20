import { CHAOS_RESPONSE_POINTS, CHAOS_VOTE_POINTS } from "@partyverse/shared";
import { nanoid } from "nanoid";
import { generateChaosChallenge } from "../ai/generators/chaos";
import { leaderboardFromRoom } from "../rooms/serialize";
import { clearTimer, transition } from "../rooms/stateMachine";
import type { InternalRoom } from "../rooms/types";
import type { BroadcastFn, GameController } from "./types";

function finishGame(room: InternalRoom, broadcast: BroadcastFn) {
  clearTimer(room);
  const board = leaderboardFromRoom(room);
  const top = board[0]?.score ?? 0;
  room.winnerIds = board
    .filter((e) => e.score === top && top > 0)
    .map((e) => e.playerId);
  room.chaosPrompt = null;
  room.chaosResponses = null;
  transition(room, "GAME_RESULTS");
  broadcast(room);
}

function beginVotePhase(room: InternalRoom, broadcast: BroadcastFn) {
  if (!room.settings || room.settings.mode !== "chaos" || !room.chaosPrompt) {
    return;
  }
  room.chaosPhase = "vote";
  const responses = [...room.chaosSubmissions.values()].map((s, i) => ({
    id: s.id,
    text: s.text,
    anonymousLabel: `Answer ${String.fromCharCode(65 + i)}`,
  }));
  room.chaosResponses = responses;
  const now = Date.now();
  room.chaosPrompt = {
    ...room.chaosPrompt,
    timeLimitMs: room.settings.chaos.voteTimeMs,
    startedAt: now,
    endsAt: now + room.settings.chaos.voteTimeMs,
  };
  broadcast(room);

  clearTimer(room);
  room.timer = setTimeout(() => {
    void chaosController.endRound(room, broadcast);
  }, room.settings.chaos.voteTimeMs);
}

export const chaosController: GameController = {
  async startRound(room, broadcast) {
    if (!room.settings || room.settings.mode !== "chaos") return;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    const challenge = await generateChaosChallenge(room.usedQuestionIds);
    room.usedQuestionIds.add(challenge.id);

    const now = Date.now();
    const timeLimitMs = room.settings.chaos.responseTimeMs;
    room.chaosPrompt = {
      id: challenge.id,
      type: challenge.type,
      prompt: challenge.prompt,
      options: challenge.options,
      timeLimitMs,
      startedAt: now,
      endsAt: now + timeLimitMs,
    };
    room.chaosSubmissions = new Map();
    room.chaosResponses = null;
    room.chaosResult = null;
    room.chaosPhase = "respond";

    transition(room, "IN_PROGRESS");
    broadcast(room);

    clearTimer(room);
    room.timer = setTimeout(() => {
      beginVotePhase(room, broadcast);
    }, timeLimitMs);
  },

  async endRound(room, broadcast) {
    clearTimer(room);
    const responses = [...room.chaosSubmissions.values()].map((s) => {
      const player = room.players.get(s.playerId);
      const votePoints = s.votes.size * CHAOS_VOTE_POINTS;
      const responsePoints = s.text.trim() ? CHAOS_RESPONSE_POINTS : 0;
      const points = votePoints + responsePoints;
      if (player) player.score += points;
      return {
        id: s.id,
        playerId: s.playerId,
        nickname: player?.nickname ?? "Unknown",
        text: s.text,
        votes: s.votes.size,
        points,
      };
    });

    room.chaosResult = {
      promptId: room.chaosPrompt?.id ?? "",
      responses: responses.sort((a, b) => b.votes - a.votes),
      leaderboard: leaderboardFromRoom(room),
    };
    room.chaosPrompt = null;
    room.chaosResponses = null;
    room.chaosPhase = null;
    transition(room, "ROUND_RESULTS");
    broadcast(room);

    room.timer = setTimeout(() => {
      room.roundIndex += 1;
      if (room.roundIndex >= room.totalRounds) {
        finishGame(room, broadcast);
      } else {
        void chaosController.startRound(room, broadcast);
      }
    }, 5000);
  },
};

export function submitChaosResponse(
  room: InternalRoom,
  playerId: string,
  promptId: string,
  text: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.chaosPhase !== "respond" ||
    !room.chaosPrompt ||
    room.chaosPrompt.id !== promptId
  ) {
    return "invalid";
  }
  if (room.chaosSubmissions.has(playerId)) return "duplicate";
  room.chaosSubmissions.set(playerId, {
    id: nanoid(10),
    playerId,
    text,
    votes: new Set(),
  });
  const connected = [...room.players.values()].filter((p) => p.connected);
  if (connected.every((p) => room.chaosSubmissions.has(p.id))) return "ok-all";
  return "ok";
}

export function submitChaosVote(
  room: InternalRoom,
  playerId: string,
  promptId: string,
  responseId: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.chaosPhase !== "vote" ||
    !room.chaosPrompt ||
    room.chaosPrompt.id !== promptId
  ) {
    return "invalid";
  }
  const target = [...room.chaosSubmissions.values()].find((s) => s.id === responseId);
  if (!target || target.playerId === playerId) return "invalid";
  for (const sub of room.chaosSubmissions.values()) {
    if (sub.votes.has(playerId)) return "duplicate";
  }
  target.votes.add(playerId);

  const connected = [...room.players.values()].filter((p) => p.connected);
  const hasVoted = (id: string) =>
    [...room.chaosSubmissions.values()].some((s) => s.votes.has(id));
  const canVote = (id: string) =>
    [...room.chaosSubmissions.values()].some((s) => s.playerId !== id);
  const required = connected.filter((p) => canVote(p.id));
  if (required.length > 0 && required.every((p) => hasVoted(p.id))) {
    return "ok-all";
  }
  return "ok";
}

export { beginVotePhase };
