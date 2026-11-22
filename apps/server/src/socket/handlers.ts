import {
  SOCKET_EVENTS,
  bluffReadySchema,
  bluffVoteSchema,
  brainAnswerSchema,
  chaosRespondSchema,
  chaosVoteSchema,
  chatSendSchema,
  createRoomSchema,
  dilemmaVoteSchema,
  gameSelectSchema,
  geetRespondSchema,
  geetVoteSchema,
  hostTransferSchema,
  joinRoomSchema,
  mindAnswerSchema,
  readySchema,
  reconnectSchema,
} from "@partyverse/shared";
import type { Server } from "socket.io";
import { config } from "../config";
import {
  beginVotePhase,
  brainController,
  dilemmaController,
  geetController,
  mindController,
  RoomService,
} from "../rooms/RoomService";
import { submitBrainAnswer } from "../games/brain";
import {
  beginVoting,
  reveal,
  submitBluffReady,
  submitBluffVote,
} from "../games/bluff";
import {
  chaosController,
  submitChaosResponse,
  submitChaosVote,
} from "../games/chaos";
import { submitDilemmaVote } from "../games/dilemma";
import {
  beginGeetVotePhase,
  submitGeetResponse,
  submitGeetVote,
} from "../games/geet";
import { submitMindAnswer } from "../games/mind";
import type { InMemoryRoomStore } from "../rooms/RoomStore";
import { toPublicRoom } from "../rooms/serialize";
import { sanitizeChat } from "../security/sanitize";
import { checkRateLimit } from "../security/rateLimit";
import {
  bindSocketRoom,
  createBroadcaster,
  getAuthorizedRoom,
  type GameSocket,
} from "./context";

function emitError(
  socket: GameSocket,
  code: string,
  message: string
) {
  socket.emit(SOCKET_EVENTS.ROOM_ERROR, { code, message });
}

export function registerHandlers(
  io: Server,
  store: InMemoryRoomStore,
  rooms: RoomService
) {
  const broadcast = createBroadcaster(io);

  io.on("connection", (raw) => {
    const socket = raw as GameSocket;
    socket.emit(SOCKET_EVENTS.CONNECTION_ACK, { ok: true });

    socket.on(SOCKET_EVENTS.ROOM_CREATE, (payload, ack) => {
      const parsed = createRoomSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "INVALID_PAYLOAD", "Invalid create payload");
        ack?.({ ok: false });
        return;
      }
      const { room, playerId, membershipToken } = rooms.createRoom(
        parsed.data.nickname,
        parsed.data.avatar,
        socket.id
      );
      bindSocketRoom(socket, room.code, playerId, membershipToken);
      const response = {
        room: toPublicRoom(room),
        playerId,
        membershipToken,
      };
      ack?.(response);
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload, ack) => {
      const parsed = joinRoomSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "INVALID_PAYLOAD", "Invalid join payload");
        ack?.({ ok: false });
        return;
      }
      const result = rooms.joinRoom(
        parsed.data.code,
        parsed.data.nickname,
        parsed.data.avatar,
        socket.id
      );
      if ("error" in result) {
        const err = result.error;
        const messages: Record<typeof err, string> = {
          ROOM_NOT_FOUND:
            "Room not found. Ask for a fresh invite — the old room may have expired.",
          ROOM_FULL: "That room is full.",
          GAME_UNAVAILABLE: "The game already started — ask the host for a new room.",
          NICKNAME_TAKEN: "That nickname is taken in this room. Try another.",
        };
        emitError(socket, err, messages[err]);
        ack?.({ ok: false, error: messages[err] });
        return;
      }
      bindSocketRoom(
        socket,
        result.room.code,
        result.playerId,
        result.membershipToken
      );
      ack?.({
        room: toPublicRoom(result.room),
        playerId: result.playerId,
        membershipToken: result.membershipToken,
      });
      broadcast(result.room);
      io.to(result.room.code).emit(SOCKET_EVENTS.PLAYER_EVENT, {
        type: "join",
        playerId: result.playerId,
        nickname: parsed.data.nickname,
      });
    });

    socket.on(SOCKET_EVENTS.ROOM_RECONNECT, (payload, ack) => {
      const parsed = reconnectSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "INVALID_PAYLOAD", "Invalid reconnect payload");
        ack?.({ ok: false });
        return;
      }
      const result = rooms.reconnect(
        parsed.data.code,
        parsed.data.playerId,
        parsed.data.membershipToken,
        socket.id
      );
      if ("error" in result) {
        emitError(socket, result.error!, "Unable to reconnect");
        ack?.({ ok: false });
        return;
      }
      bindSocketRoom(
        socket,
        result.room.code,
        result.playerId,
        result.membershipToken
      );
      ack?.({
        room: toPublicRoom(result.room),
        playerId: result.playerId,
        membershipToken: result.membershipToken,
        privateBluff: result.privateBluff,
      });
      broadcast(result.room);
    });

    socket.on(SOCKET_EVENTS.PLAYER_READY, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = readySchema.safeParse(payload);
      if (!parsed.success) return;
      rooms.setReady(room, socket.data.playerId, parsed.data.ready);
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.HOST_TRANSFER, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = hostTransferSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "INVALID_PAYLOAD", "Invalid host transfer");
        return;
      }
      const result = rooms.transferHost(
        room,
        socket.data.playerId,
        parsed.data.targetPlayerId
      );
      if ("error" in result) {
        emitError(
          socket,
          result.error!,
          result.error === "UNAUTHORIZED"
            ? "Only the host can transfer host"
            : "Pick a connected player to make host"
        );
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.CHAT_SEND, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = chatSendSchema.safeParse(payload);
      if (!parsed.success) return;
      if (
        !checkRateLimit(
          `chat:${socket.data.playerId}`,
          config.chatRateLimitPerMin
        )
      ) {
        emitError(socket, "RATE_LIMITED", "Slow down chat a bit");
        return;
      }
      const text = sanitizeChat(parsed.data.text);
      if (!text) return;
      const message = rooms.addChat(room, socket.data.playerId, text);
      if (message) {
        io.to(room.code).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
      }
    });

    socket.on(SOCKET_EVENTS.GAME_SELECT, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = gameSelectSchema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "INVALID_PAYLOAD", "Invalid game settings");
        return;
      }
      const result = rooms.selectGame(room, socket.data.playerId, parsed.data);
      if ("error" in result) {
        emitError(socket, result.error!, "Cannot select game");
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.GAME_START, async () => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const result = await rooms.startGame(
        room,
        socket.data.playerId,
        broadcast,
        (playerId, privateInfo) => {
          const player = room.players.get(playerId);
          if (player?.socketId) {
            io.to(player.socketId).emit(SOCKET_EVENTS.PRIVATE_BLUFF, privateInfo);
          }
        }
      );
      if ("error" in result) {
        emitError(socket, result.error!, "Cannot start game");
      }
    });

    socket.on(SOCKET_EVENTS.GAME_PLAY_AGAIN, () => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const result = rooms.playAgain(room, socket.data.playerId);
      if ("error" in result) {
        emitError(socket, result.error!, "Cannot restart");
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.GAME_ABORT, () => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const result = rooms.abortToLobby(room, socket.data.playerId);
      if ("error" in result) {
        emitError(socket, result.error!, "Cannot switch games right now");
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.BRAIN_ANSWER, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = brainAnswerSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitBrainAnswer(
        room,
        socket.data.playerId,
        parsed.data.questionId,
        parsed.data.answer
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already answered");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot answer now");
        return;
      }
      if (status === "ok-all") {
        void brainController.endRound(room, broadcast);
      }
    });

    socket.on(SOCKET_EVENTS.CHAOS_RESPOND, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = chaosRespondSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitChaosResponse(
        room,
        socket.data.playerId,
        parsed.data.promptId,
        sanitizeChat(parsed.data.text)
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already responded");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot respond now");
        return;
      }
      if (status === "ok-all") {
        beginVotePhase(room, broadcast);
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.CHAOS_VOTE, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = chaosVoteSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitChaosVote(
        room,
        socket.data.playerId,
        parsed.data.promptId,
        parsed.data.responseId
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already voted");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot vote for that answer");
        return;
      }
      if (status === "ok-all") {
        void chaosController.endRound(room, broadcast);
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.BLUFF_VOTE, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = bluffVoteSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitBluffVote(
        room,
        socket.data.playerId,
        parsed.data.targetPlayerId
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already voted");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot vote now");
        return;
      }
      if (status === "ok-all") {
        reveal(room, broadcast);
      }
    });

    socket.on(SOCKET_EVENTS.BLUFF_READY, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = bluffReadySchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitBluffReady(
        room,
        socket.data.playerId,
        parsed.data.ready
      );
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Ready only during discussion");
        return;
      }
      if (status === "ok-all") {
        beginVoting(room, broadcast);
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.DILEMMA_VOTE, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = dilemmaVoteSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitDilemmaVote(
        room,
        socket.data.playerId,
        parsed.data.promptId,
        parsed.data.choiceIndex
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already picked");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot vote now");
        return;
      }
      if (status === "ok-all") {
        void dilemmaController.endRound(room, broadcast);
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.GEET_RESPOND, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = geetRespondSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitGeetResponse(
        room,
        socket.data.playerId,
        parsed.data.promptId,
        parsed.data.text
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already submitted");
        return;
      }
      if (status === "invalid") {
        emitError(
          socket,
          "INVALID_STATE",
          "Song title must start with the given letter"
        );
        return;
      }
      if (status === "ok-all") {
        beginGeetVotePhase(room, broadcast);
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.GEET_VOTE, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = geetVoteSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitGeetVote(
        room,
        socket.data.playerId,
        parsed.data.promptId,
        parsed.data.responseId
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already voted");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot vote for that song");
        return;
      }
      if (status === "ok-all") {
        void geetController.endRound(room, broadcast);
        return;
      }
      broadcast(room);
    });

    socket.on(SOCKET_EVENTS.MIND_ANSWER, (payload) => {
      const room = getAuthorizedRoom(socket, store);
      if (!room || !socket.data.playerId) return;
      const parsed = mindAnswerSchema.safeParse(payload);
      if (!parsed.success) return;
      const status = submitMindAnswer(
        room,
        socket.data.playerId,
        parsed.data.promptId,
        parsed.data.answer
      );
      if (status === "duplicate") {
        emitError(socket, "ALREADY_SUBMITTED", "Already answered");
        return;
      }
      if (status === "invalid") {
        emitError(socket, "INVALID_STATE", "Cannot answer now");
        return;
      }
      if (status === "ok-all") {
        void mindController.endRound(room, broadcast);
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;
      const room = rooms.leave(roomCode, playerId, { permanent: true });
      socket.data = {};
      void socket.leave(roomCode);
      if (room) broadcast(room);
    });

    socket.on("disconnect", () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;
      // Soft leave — keep room alive so invitees can join while host reconnects
      const room = rooms.leave(roomCode, playerId, { permanent: false });
      if (room) {
        io.to(room.code).emit(SOCKET_EVENTS.PLAYER_EVENT, {
          type: "disconnect",
          playerId,
        });
        broadcast(room);
      }
    });
  });
}
