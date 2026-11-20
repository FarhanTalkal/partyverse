import { MIND_MATCH_POINTS, MIND_TRIPLE_BONUS } from "@partyverse/shared";
import { generateMindPrompt } from "../ai/generators/mind";
import { normalizeAnswer } from "../security/sanitize";
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
  room.mindPrompt = null;
  transition(room, "GAME_RESULTS");
  broadcast(room);
}

export const mindController: GameController = {
  async startRound(room, broadcast) {
    if (!room.settings || room.settings.mode !== "mind") return;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    const prompt = await generateMindPrompt(room.usedQuestionIds);
    room.usedQuestionIds.add(prompt.id);

    const now = Date.now();
    const timeLimitMs = room.settings.mind.responseTimeMs;
    room.mindPrompt = {
      id: prompt.id,
      prompt: prompt.prompt,
      hint: prompt.hint,
      timeLimitMs,
      startedAt: now,
      endsAt: now + timeLimitMs,
    };
    room.mindSubmissions = new Map();
    room.mindResult = null;

    transition(room, "IN_PROGRESS");
    broadcast(room);

    clearTimer(room);
    room.timer = setTimeout(() => {
      void mindController.endRound(room, broadcast);
    }, timeLimitMs);
  },

  async endRound(room, broadcast) {
    clearTimer(room);
    const groups = new Map<string, string[]>();

    for (const [playerId, sub] of room.mindSubmissions) {
      const key = normalizeAnswer(sub.answer);
      if (!key) continue;
      const list = groups.get(key) ?? [];
      list.push(playerId);
      groups.set(key, list);
    }

    const submissions = [...room.players.values()].map((player) => {
      const sub = room.mindSubmissions.get(player.id);
      const key = sub ? normalizeAnswer(sub.answer) : "";
      const peers = key ? groups.get(key) ?? [] : [];
      const matchCount = Math.max(0, peers.length - 1);
      let points = 0;
      if (matchCount > 0) {
        points = matchCount * MIND_MATCH_POINTS;
        if (peers.length >= 3) points += MIND_TRIPLE_BONUS;
        player.score += points;
      }
      return {
        playerId: player.id,
        nickname: player.nickname,
        answer: sub?.answer ?? "",
        matchCount,
        points,
      };
    });

    const clusters = [...groups.entries()]
      .map(([answer, playerIds]) => ({
        answer:
          room.mindSubmissions.get(playerIds[0])?.answer ?? answer,
        playerIds,
        size: playerIds.length,
      }))
      .sort((a, b) => b.size - a.size);

    room.mindResult = {
      promptId: room.mindPrompt?.id ?? "",
      submissions,
      clusters,
      leaderboard: leaderboardFromRoom(room),
    };
    room.mindPrompt = null;
    transition(room, "ROUND_RESULTS");
    broadcast(room);

    room.timer = setTimeout(() => {
      room.roundIndex += 1;
      if (room.roundIndex >= room.totalRounds) {
        finishGame(room, broadcast);
      } else {
        void mindController.startRound(room, broadcast);
      }
    }, 5000);
  },
};

export function submitMindAnswer(
  room: InternalRoom,
  playerId: string,
  promptId: string,
  answer: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (room.state !== "IN_PROGRESS" || !room.mindPrompt) return "invalid";
  if (room.mindPrompt.id !== promptId) return "invalid";
  if (room.mindSubmissions.has(playerId)) return "duplicate";
  room.mindSubmissions.set(playerId, {
    playerId,
    answer,
    submittedAt: Date.now(),
  });
  const connected = [...room.players.values()].filter((p) => p.connected);
  if (connected.every((p) => room.mindSubmissions.has(p.id))) return "ok-all";
  return "ok";
}
