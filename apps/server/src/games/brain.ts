import {
  BRAIN_BASE_POINTS,
  BRAIN_SPEED_BONUS_MAX,
  type BrainRoundResult,
} from "@partyverse/shared";
import { generateBrainQuestion } from "../ai/generators/brain";
import { normalizeAnswer } from "../security/sanitize";
import { leaderboardFromRoom } from "../rooms/serialize";
import { clearTimer, transition } from "../rooms/stateMachine";
import type { InternalRoom } from "../rooms/types";
import type { GameController } from "./types";

function isCorrect(submitted: string, expected: string): boolean {
  return normalizeAnswer(submitted) === normalizeAnswer(expected);
}

export const brainController: GameController = {
  async startRound(room, broadcast) {
    if (!room.settings || room.settings.mode !== "brain") return;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    const q = await generateBrainQuestion({
      category: room.settings.brain.category,
      difficulty: room.settings.brain.difficulty,
      usedIds: room.usedQuestionIds,
    });
    room.usedQuestionIds.add(q.id);

    const now = Date.now();
    const timeLimitMs = room.settings.brain.timePerQuestionMs;
    room.brainQuestion = {
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      timeLimitMs,
      startedAt: now,
      endsAt: now + timeLimitMs,
    };
    room.brainCorrectAnswer = q.answer;
    room.brainExplanation = q.explanation;
    room.brainSubmissions = new Map();
    room.brainResult = null;

    transition(room, "IN_PROGRESS");
    broadcast(room);

    clearTimer(room);
    room.timer = setTimeout(() => {
      void brainController.endRound(room, broadcast);
    }, timeLimitMs);
  },

  async endRound(room, broadcast) {
    if (!room.brainQuestion || !room.brainCorrectAnswer) return;
    clearTimer(room);

    const q = room.brainQuestion;
    const correct = room.brainCorrectAnswer;
    const submissions: BrainRoundResult["submissions"] = [];

    for (const player of room.players.values()) {
      const sub = room.brainSubmissions.get(player.id);
      if (!sub) {
        submissions.push({
          playerId: player.id,
          nickname: player.nickname,
          answer: "",
          correct: false,
          points: 0,
          timeMs: q.timeLimitMs,
        });
        continue;
      }
      const ok = isCorrect(sub.answer, correct);
      let points = 0;
      if (ok) {
        const speedRatio = Math.max(0, 1 - sub.timeMs / q.timeLimitMs);
        points =
          BRAIN_BASE_POINTS + Math.round(BRAIN_SPEED_BONUS_MAX * speedRatio);
        player.score += points;
      }
      submissions.push({
        playerId: player.id,
        nickname: player.nickname,
        answer: sub.answer,
        correct: ok,
        points,
        timeMs: sub.timeMs,
      });
    }

    room.brainResult = {
      questionId: q.id,
      correctAnswer: correct,
      explanation: room.brainExplanation ?? undefined,
      submissions,
      leaderboard: leaderboardFromRoom(room),
    };
    room.brainQuestion = null;
    transition(room, "ROUND_RESULTS");
    broadcast(room);

    clearTimer(room);
    room.timer = setTimeout(() => {
      room.roundIndex += 1;
      if (room.roundIndex >= room.totalRounds) {
        finishGame(room, broadcast);
      } else {
        void brainController.startRound(room, broadcast);
      }
    }, 5000);
  },
};

function finishGame(
  room: InternalRoom,
  broadcast: (room: InternalRoom) => void
) {
  clearTimer(room);
  const board = leaderboardFromRoom(room);
  const top = board[0]?.score ?? 0;
  room.winnerIds = board.filter((e) => e.score === top && top > 0).map((e) => e.playerId);
  room.brainQuestion = null;
  transition(room, "GAME_RESULTS");
  broadcast(room);
}

export function submitBrainAnswer(
  room: InternalRoom,
  playerId: string,
  questionId: string,
  answer: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (room.state !== "IN_PROGRESS" || !room.brainQuestion) return "invalid";
  if (room.brainQuestion.id !== questionId) return "invalid";
  if (room.brainSubmissions.has(playerId)) return "duplicate";
  const elapsed = Date.now() - room.brainQuestion.startedAt;
  room.brainSubmissions.set(playerId, {
    playerId,
    answer,
    timeMs: Math.min(elapsed, room.brainQuestion.timeLimitMs),
    submittedAt: Date.now(),
  });

  const connected = [...room.players.values()].filter((p) => p.connected);
  if (connected.every((p) => room.brainSubmissions.has(p.id))) {
    return "ok-all";
  }
  return "ok";
}
