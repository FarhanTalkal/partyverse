import { GEET_RESPONSE_POINTS, GEET_VOTE_POINTS } from "@partyverse/shared";
import { nanoid } from "nanoid";
import { GEET_BANK } from "../content/geetPrompts";
import { leaderboardFromRoom } from "../rooms/serialize";
import { clearTimer, transition } from "../rooms/stateMachine";
import type { InternalRoom } from "../rooms/types";
import type { BroadcastFn, GameController } from "./types";

function shufflePick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function finishGame(room: InternalRoom, broadcast: BroadcastFn) {
  clearTimer(room);
  const board = leaderboardFromRoom(room);
  const top = board[0]?.score ?? 0;
  room.winnerIds = board
    .filter((e) => e.score === top && top > 0)
    .map((e) => e.playerId);
  room.geetPrompt = null;
  room.geetResponses = null;
  room.geetPhase = null;
  transition(room, "GAME_RESULTS");
  broadcast(room);
}

function beginVotePhase(room: InternalRoom, broadcast: BroadcastFn) {
  if (!room.settings || room.settings.mode !== "geet" || !room.geetPrompt) {
    return;
  }
  room.geetPhase = "vote";
  room.geetResponses = [...room.geetSubmissions.values()].map((s, i) => ({
    id: s.id,
    text: s.text,
    anonymousLabel: `Song ${String.fromCharCode(65 + i)}`,
  }));
  const now = Date.now();
  room.geetPrompt = {
    ...room.geetPrompt,
    timeLimitMs: room.settings.geet.voteTimeMs,
    startedAt: now,
    endsAt: now + room.settings.geet.voteTimeMs,
  };
  broadcast(room);
  clearTimer(room);
  room.timer = setTimeout(() => {
    void geetController.endRound(room, broadcast);
  }, room.settings.geet.voteTimeMs);
}

export const geetController: GameController = {
  async startRound(room, broadcast) {
    if (!room.settings || room.settings.mode !== "geet") return;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    if (room.usedQuestionIds.size >= Math.floor(GEET_BANK.length * 0.85)) {
      for (const id of [...room.usedQuestionIds]) {
        if (id.startsWith("ge-")) room.usedQuestionIds.delete(id);
      }
    }
    const unused = GEET_BANK.filter((g) => !room.usedQuestionIds.has(g.id));
    const pick = shufflePick(unused.length ? unused : GEET_BANK);
    room.usedQuestionIds.add(pick.id);

    const now = Date.now();
    const timeLimitMs = room.settings.geet.responseTimeMs;
    room.geetPrompt = {
      id: pick.id,
      letter: pick.letter,
      hint: pick.hint,
      timeLimitMs,
      startedAt: now,
      endsAt: now + timeLimitMs,
    };
    room.geetSubmissions = new Map();
    room.geetResponses = null;
    room.geetResult = null;
    room.geetPhase = "respond";

    transition(room, "IN_PROGRESS");
    broadcast(room);
    clearTimer(room);
    room.timer = setTimeout(() => beginVotePhase(room, broadcast), timeLimitMs);
  },

  async endRound(room, broadcast) {
    clearTimer(room);
    const responses = [...room.geetSubmissions.values()].map((s) => {
      const player = room.players.get(s.playerId);
      const votePoints = s.votes.size * GEET_VOTE_POINTS;
      const responsePoints = s.text.trim() ? GEET_RESPONSE_POINTS : 0;
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

    room.geetResult = {
      promptId: room.geetPrompt?.id ?? "",
      responses: responses.sort((a, b) => b.votes - a.votes),
      leaderboard: leaderboardFromRoom(room),
    };
    room.geetPrompt = null;
    room.geetResponses = null;
    room.geetPhase = null;
    transition(room, "ROUND_RESULTS");
    broadcast(room);

    room.timer = setTimeout(() => {
      room.roundIndex += 1;
      if (room.roundIndex >= room.totalRounds) {
        finishGame(room, broadcast);
      } else {
        void geetController.startRound(room, broadcast);
      }
    }, 5000);
  },
};

export function submitGeetResponse(
  room: InternalRoom,
  playerId: string,
  promptId: string,
  text: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.geetPhase !== "respond" ||
    room.geetPrompt?.id !== promptId
  ) {
    return "invalid";
  }
  if (room.geetSubmissions.has(playerId)) return "duplicate";
  const cleaned = text.trim();
  if (!cleaned) return "invalid";
  const letter = room.geetPrompt.letter.toUpperCase();
  if (!cleaned.toUpperCase().startsWith(letter)) return "invalid";

  room.geetSubmissions.set(playerId, {
    id: nanoid(8),
    playerId,
    text: cleaned,
    votes: new Set(),
  });
  const connected = [...room.players.values()].filter((p) => p.connected);
  if (connected.every((p) => room.geetSubmissions.has(p.id))) return "ok-all";
  return "ok";
}

export function submitGeetVote(
  room: InternalRoom,
  playerId: string,
  promptId: string,
  responseId: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.geetPhase !== "vote" ||
    room.geetPrompt?.id !== promptId
  ) {
    return "invalid";
  }
  const target = [...room.geetSubmissions.values()].find((s) => s.id === responseId);
  if (!target || target.playerId === playerId) return "invalid";
  if ([...room.geetSubmissions.values()].some((s) => s.votes.has(playerId))) {
    return "duplicate";
  }
  target.votes.add(playerId);

  const connected = [...room.players.values()].filter((p) => p.connected);
  const canVote = connected.filter((p) =>
    [...room.geetSubmissions.values()].some((s) => s.playerId !== p.id)
  );
  const voted = canVote.filter((p) =>
    [...room.geetSubmissions.values()].some((s) => s.votes.has(p.id))
  );
  if (canVote.length > 0 && voted.length >= canVote.length) return "ok-all";
  return "ok";
}

export { beginVotePhase as beginGeetVotePhase };
