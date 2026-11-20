import type { PublicPlayer, PublicRoom } from "@partyverse/shared";
import type { InternalRoom } from "./types";

export function toPublicPlayer(
  room: InternalRoom,
  playerId: string
): PublicPlayer {
  const p = room.players.get(playerId)!;
  return {
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    ready: p.ready,
    connected: p.connected,
    score: p.score,
    isHost: room.hostId === p.id,
  };
}

export function toPublicRoom(room: InternalRoom): PublicRoom {
  return {
    code: room.code,
    state: room.state,
    hostId: room.hostId,
    players: [...room.players.keys()].map((id) => toPublicPlayer(room, id)),
    chat: room.chat.slice(-50),
    selectedMode: room.selectedMode,
    settings: room.settings,
    roundIndex: room.roundIndex,
    totalRounds: room.totalRounds,
    brainQuestion: room.brainQuestion,
    brainResult: room.brainResult,
    chaosPrompt: room.chaosPrompt,
    chaosResponses: room.chaosResponses,
    chaosVotedIds: [
      ...new Set(
        [...room.chaosSubmissions.values()].flatMap((s) => [...s.votes])
      ),
    ],
    chaosResult: room.chaosResult,
    bluffScenario: room.bluffScenario,
    bluffReveal: room.bluffReveal,
    mindPrompt: room.mindPrompt,
    mindResult: room.mindResult,
    winnerIds: room.winnerIds,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

export function leaderboardFromRoom(room: InternalRoom) {
  return [...room.players.values()]
    .map((p) => ({
      playerId: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
    }))
    .sort((a, b) => b.score - a.score);
}
