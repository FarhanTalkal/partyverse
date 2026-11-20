import { z } from "zod";
import {
  AVATARS,
  BRAIN_CATEGORIES,
  CHAT_MAX_LENGTH,
  DIFFICULTIES,
  GAME_MODES,
  NICKNAME_MAX,
  NICKNAME_MIN,
  ROOM_CODE_LENGTH,
} from "./constants";

export const SOCKET_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_RECONNECT: "room:reconnect",
  PLAYER_READY: "player:ready",
  PLAYER_UPDATE: "player:update",
  CHAT_SEND: "chat:send",
  GAME_SELECT: "game:select",
  GAME_START: "game:start",
  GAME_PLAY_AGAIN: "game:playAgain",
  GAME_ABORT: "game:abort",
  BRAIN_ANSWER: "brain:answer",
  CHAOS_RESPOND: "chaos:respond",
  CHAOS_VOTE: "chaos:vote",
  BLUFF_VOTE: "bluff:vote",
  MIND_ANSWER: "mind:answer",

  ROOM_STATE: "room:state",
  ROOM_ERROR: "room:error",
  CHAT_MESSAGE: "chat:message",
  PLAYER_EVENT: "player:event",
  PRIVATE_BLUFF: "bluff:private",
  CONNECTION_ACK: "connection:ack",
} as const;

export const nicknameSchema = z
  .string()
  .trim()
  .min(NICKNAME_MIN)
  .max(NICKNAME_MAX)
  .regex(/^[a-zA-Z0-9 _-]+$/, "Nickname contains invalid characters");

export const avatarSchema = z.enum(AVATARS);
export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(ROOM_CODE_LENGTH)
  .regex(/^[A-Z0-9]+$/);

export const createRoomSchema = z.object({
  nickname: nicknameSchema,
  avatar: avatarSchema,
});

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  nickname: nicknameSchema,
  avatar: avatarSchema,
});

export const reconnectSchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().min(8).max(64),
  membershipToken: z.string().min(8).max(128),
});

export const readySchema = z.object({
  ready: z.boolean(),
});

export const updatePlayerSchema = z.object({
  nickname: nicknameSchema.optional(),
  avatar: avatarSchema.optional(),
});

export const chatSendSchema = z.object({
  text: z.string().trim().min(1).max(CHAT_MAX_LENGTH),
});

export const brainSettingsSchema = z.object({
  category: z.enum(BRAIN_CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  rounds: z.number().int().min(3).max(15).default(12),
  timePerQuestionMs: z.number().int().min(10000).max(60000).default(20000),
  practice: z.boolean().optional(),
});

export const chaosSettingsSchema = z.object({
  rounds: z.number().int().min(3).max(15).default(10),
  responseTimeMs: z.number().int().min(15000).max(90000).default(45000),
  voteTimeMs: z.number().int().min(10000).max(60000).default(30000),
});

export const bluffSettingsSchema = z.object({
  discussionTimeMs: z.number().int().min(30000).max(180000).default(60000),
  voteTimeMs: z.number().int().min(15000).max(60000).default(30000),
});

export const mindSettingsSchema = z.object({
  rounds: z.number().int().min(3).max(15).default(10),
  responseTimeMs: z.number().int().min(12000).max(60000).default(25000),
  practice: z.boolean().optional(),
});

export const gameSelectSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("brain"), brain: brainSettingsSchema }),
  z.object({ mode: z.literal("chaos"), chaos: chaosSettingsSchema }),
  z.object({ mode: z.literal("bluff"), bluff: bluffSettingsSchema }),
  z.object({ mode: z.literal("mind"), mind: mindSettingsSchema }),
]);

export const brainAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().trim().min(1).max(200),
});

export const chaosRespondSchema = z.object({
  promptId: z.string().min(1),
  text: z.string().trim().min(1).max(280),
});

export const chaosVoteSchema = z.object({
  promptId: z.string().min(1),
  responseId: z.string().min(1),
});

export const bluffVoteSchema = z.object({
  targetPlayerId: z.string().min(1),
});

export const mindAnswerSchema = z.object({
  promptId: z.string().min(1),
  answer: z.string().trim().min(1).max(80),
});

export const roomErrorSchema = z.object({
  code: z.enum([
    "INVALID_PAYLOAD",
    "ROOM_NOT_FOUND",
    "ROOM_FULL",
    "ROOM_CLOSED",
    "UNAUTHORIZED",
    "INVALID_STATE",
    "ALREADY_SUBMITTED",
    "RATE_LIMITED",
    "NICKNAME_TAKEN",
    "GAME_UNAVAILABLE",
    "MIN_PLAYERS",
    "INTERNAL",
  ]),
  message: z.string(),
});

export type CreateRoomPayload = z.infer<typeof createRoomSchema>;
export type JoinRoomPayload = z.infer<typeof joinRoomSchema>;
export type ReconnectPayload = z.infer<typeof reconnectSchema>;
export type GameSelectPayload = z.infer<typeof gameSelectSchema>;
export type RoomErrorPayload = z.infer<typeof roomErrorSchema>;

export { GAME_MODES };
