import { nanoid } from "nanoid";
import { generateBluffScenario } from "../ai/generators/bluff";
import { leaderboardFromRoom } from "../rooms/serialize";
import { clearTimer, transition } from "../rooms/stateMachine";
import type { InternalRoom } from "../rooms/types";
import type { BroadcastFn, GameController } from "./types";
import type { BluffPrivateInfo } from "@partyverse/shared";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reveal(room: InternalRoom, broadcast: BroadcastFn) {
  clearTimer(room);
  if (!room.bluffCulpritId) return;

  const votedFor = [...room.bluffVotes.entries()].map(([voterId, targetId]) => ({
    voterId,
    targetId,
  }));
  const correctVoters = votedFor
    .filter((v) => v.targetId === room.bluffCulpritId)
    .map((v) => v.voterId);

  for (const voterId of correctVoters) {
    const p = room.players.get(voterId);
    if (p) p.score += 150;
  }
  const culprit = room.players.get(room.bluffCulpritId);
  const caught = correctVoters.length >= Math.ceil(room.players.size / 2);
  if (culprit && !caught) culprit.score += 200;

  room.bluffReveal = {
    culpritPlayerId: room.bluffCulpritId,
    culpritNickname: culprit?.nickname ?? "Unknown",
    roles: [...room.players.values()].map((p) => ({
      playerId: p.id,
      nickname: p.nickname,
      role: room.bluffPrivate.get(p.id)?.role ?? "Unknown",
    })),
    votedFor,
    correctVoters,
    leaderboard: leaderboardFromRoom(room),
  };

  const board = leaderboardFromRoom(room);
  const top = board[0]?.score ?? 0;
  room.winnerIds = board
    .filter((e) => e.score === top && top > 0)
    .map((e) => e.playerId);

  if (room.bluffScenario) {
    room.bluffScenario = { ...room.bluffScenario, phase: "reveal" };
  }
  transition(room, "GAME_RESULTS");
  broadcast(room);
}

function beginDiscussion(
  room: InternalRoom,
  broadcast: BroadcastFn,
  discussionMs: number
) {
  if (!room.settings || room.settings.mode !== "bluff" || !room.bluffScenario) {
    return;
  }
  room.bluffReady = new Set();
  const now = Date.now();
  room.bluffScenario = {
    ...room.bluffScenario,
    phase: "discussion",
    phaseStartedAt: now,
    discussionEndsAt: now + discussionMs,
  };
  broadcast(room);
  clearTimer(room);
  room.timer = setTimeout(() => beginVoting(room, broadcast), discussionMs);
}

export function submitBluffReady(
  room: InternalRoom,
  playerId: string,
  ready: boolean
): "ok" | "ok-all" | "invalid" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.bluffScenario?.phase !== "discussion"
  ) {
    return "invalid";
  }
  if (ready) room.bluffReady.add(playerId);
  else room.bluffReady.delete(playerId);
  const connected = [...room.players.values()].filter((p) => p.connected);
  if (
    connected.length > 0 &&
    connected.every((p) => room.bluffReady.has(p.id))
  ) {
    return "ok-all";
  }
  return "ok";
}

function beginVoting(room: InternalRoom, broadcast: BroadcastFn) {
  if (!room.settings || room.settings.mode !== "bluff" || !room.bluffScenario) {
    return;
  }
  room.bluffVotes = new Map();
  const now = Date.now();
  room.bluffScenario = {
    ...room.bluffScenario,
    phase: "voting",
    phaseStartedAt: now,
    voteEndsAt: now + room.settings.bluff.voteTimeMs,
  };
  broadcast(room);
  clearTimer(room);
  room.timer = setTimeout(() => reveal(room, broadcast), room.settings.bluff.voteTimeMs);
}

export const bluffController: GameController = {
  async startRound(room, broadcast) {
    if (!room.settings || room.settings.mode !== "bluff") return;
    transition(room, "PREPARING_ROUND");
    broadcast(room);

    const players = [...room.players.values()];
    const scenario = await generateBluffScenario(
      players.length,
      room.usedQuestionIds
    );
    if (scenario.id) room.usedQuestionIds.add(scenario.id);
    const roles = shuffle(scenario.roles).slice(0, players.length);
    // Ensure exactly one culprit in assigned set
    if (!roles.some((r) => r.isCulprit)) {
      roles[0] = { ...roles[0], isCulprit: true };
      for (let i = 1; i < roles.length; i++) {
        roles[i] = { ...roles[i], isCulprit: false };
      }
    } else {
      let seen = false;
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].isCulprit) {
          if (seen) roles[i] = { ...roles[i], isCulprit: false };
          else seen = true;
        }
      }
    }

    room.bluffPrivate = new Map();
    room.bluffVotes = new Map();
    room.bluffReady = new Set();
    room.bluffReveal = null;
    room.bluffCulpritId = null;
    room.totalRounds = 1;
    room.roundIndex = 0;

    const shuffledPlayers = shuffle(players);
    shuffledPlayers.forEach((player, i) => {
      const role = roles[i];
      const info: BluffPrivateInfo = {
        role: role.role,
        background: role.background,
        secretObjective: role.secretObjective,
        privateClues: role.privateClues,
      };
      room.bluffPrivate.set(player.id, info);
      if (role.isCulprit) room.bluffCulpritId = player.id;
    });

    const readingMs = room.settings.bluff.readingTimeMs ?? 45_000;
    const discussionMs = room.settings.bluff.discussionTimeMs;
    const now = Date.now();
    room.bluffScenario = {
      id: scenario.id || nanoid(8),
      title: scenario.title,
      synopsis: scenario.synopsis,
      phase: "briefing",
      publicClues: scenario.publicClues,
      phaseStartedAt: now,
      briefingEndsAt: now + readingMs,
    };

    transition(room, "IN_PROGRESS");
    broadcast(room);
    // Private info is sent by the socket layer after broadcast

    clearTimer(room);
    room.timer = setTimeout(() => {
      beginDiscussion(room, broadcast, discussionMs);
    }, readingMs);
  },

  async endRound(room, broadcast) {
    reveal(room, broadcast);
  },
};

export function submitBluffVote(
  room: InternalRoom,
  playerId: string,
  targetPlayerId: string
): "ok" | "ok-all" | "invalid" | "duplicate" {
  if (
    room.state !== "IN_PROGRESS" ||
    room.bluffScenario?.phase !== "voting"
  ) {
    return "invalid";
  }
  if (!room.players.has(targetPlayerId) || targetPlayerId === playerId) {
    return "invalid";
  }
  if (room.bluffVotes.has(playerId)) return "duplicate";
  room.bluffVotes.set(playerId, targetPlayerId);

  const connected = [...room.players.values()].filter((p) => p.connected);
  if (connected.every((p) => room.bluffVotes.has(p.id))) return "ok-all";
  return "ok";
}

export function getPrivateBluff(
  room: InternalRoom,
  playerId: string
): BluffPrivateInfo | undefined {
  return room.bluffPrivate.get(playerId);
}

export { beginVoting, beginDiscussion, reveal };
