import {
  DILEMMA_MAJORITY_POINTS,
  DILEMMA_MINORITY_POINTS,
} from "@partyverse/shared";
import { DILEMMA_BANK } from "../content/dilemmaPrompts";
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
  room.dilemmaPrompt = null;
  transition(room, "GAME_RESULTS");
  broadcast(room);
}

export const dilemmaController: GameController = {
  async startRound(room, broadcast) {
    if (!room.settings || room.settings.mode !== "dilemma") return;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    if (room.usedQuestionIds.size >= Math.floor(DILEMMA_BANK.length * 0.85)) {
      for (const id of [...room.usedQuestionIds]) {
        if (id.startsWith("di-")) room.usedQuestionIds.delete(id);
      }
    }
    const unused = DILEMMA_BANK.filter((d) => !room.usedQuestionIds.has(d.id));
    const pick = shufflePick(unused.length ? unused : DILEMMA_BANK);
    room.usedQuestionIds.add(pick.id);

    const now = Date.now();
    const timeLimitMs = room.settings.dilemma.voteTimeMs;
    const scoring = room.roundIndex % 2 === 0 ? "majority" : "minority";
    room.dilemmaPrompt = {
      id: pick.id,
      prompt: pick.prompt,
      options: pick.options,
      scoring,
      timeLimitMs,
      startedAt: now,
      endsAt: now + timeLimitMs,
    };
    room.dilemmaVotes = new Map();
    room.dilemmaResult = null;

    transition(room, "IN_PROGRESS");
    broadcast(room);
    clearTimer(room);
    room.timer = setTimeout(() => {
      void dilemmaController.endRound(room, broadcast);
    }, timeLimitMs);
  },

  async endRound(room, broadcast) {
    clearTimer(room);
    const prompt = room.dilemmaPrompt;
    if (!prompt) return;

    const tallies = prompt.options.map((option, index) => {
      const playerIds = [...room.dilemmaVotes.entries()]
        .filter(([, choice]) => choice === index)
        .map(([id]) => id);
      return { option, count: playerIds.length, playerIds };
    });

    const scoring = prompt.scoring;
    const max = Math.max(...tallies.map((t) => t.count), 0);
    const minPositive = Math.min(
      ...tallies.filter((t) => t.count > 0).map((t) => t.count),
      max
    );
    const winningIndexes = new Set<number>();
    tallies.forEach((t, i) => {
      if (t.count === 0) return;
      if (scoring === "majority" && t.count === max) winningIndexes.add(i);
      if (scoring === "minority" && t.count === minPositive) winningIndexes.add(i);
    });

    const pointsFor =
      scoring === "majority" ? DILEMMA_MAJORITY_POINTS : DILEMMA_MINORITY_POINTS;

    const submissions = [...room.dilemmaVotes.entries()].map(
      ([playerId, choiceIndex]) => {
        const player = room.players.get(playerId);
        const win = winningIndexes.has(choiceIndex);
        const points = win ? pointsFor : 0;
        if (player) player.score += points;
        return {
          playerId,
          nickname: player?.nickname ?? "Unknown",
          choice: prompt.options[choiceIndex],
          points,
        };
      }
    );

    room.dilemmaResult = {
      promptId: prompt.id,
      tallies,
      scoring,
      submissions,
      leaderboard: leaderboardFromRoom(room),
    };
    room.dilemmaPrompt = null;
    transition(room, "ROUND_RESULTS");
    broadcast(room);

    room.timer = setTimeout(() => {
      room.roundIndex += 1;
      if (room.roundIndex >= room.totalRounds) {
        finishGame(room, broadcast);
      } else {
        void dilemmaController.startRound(room, broadcast);
      }
    }, 5000);
  },
};

export function submitDilemmaVote(
  room: InternalRoom,
  playerId: string,
  promptId: string,
  choiceIndex: 0 | 1
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.settings?.mode !== "dilemma" ||
    room.dilemmaPrompt?.id !== promptId
  ) {
    return "invalid";
  }
  if (room.dilemmaVotes.has(playerId)) return "duplicate";
  room.dilemmaVotes.set(playerId, choiceIndex);
  const connected = [...room.players.values()].filter((p) => p.connected);
  if (connected.every((p) => room.dilemmaVotes.has(p.id))) return "ok-all";
  return "ok";
}
