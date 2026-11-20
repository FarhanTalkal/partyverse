import type { Server, Socket } from "socket.io";
import type { InMemoryRoomStore } from "../rooms/RoomStore";
import type { InternalRoom } from "../rooms/types";
import { toPublicRoom } from "../rooms/serialize";
import { SOCKET_EVENTS } from "@partyverse/shared";

export interface SocketData {
  playerId?: string;
  roomCode?: string;
  membershipToken?: string;
}

export type GameSocket = Socket & { data: SocketData };

export function createBroadcaster(io: Server) {
  return function broadcast(room: InternalRoom) {
    io.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE, toPublicRoom(room));
  };
}

export function bindSocketRoom(
  socket: GameSocket,
  roomCode: string,
  playerId: string,
  membershipToken: string
) {
  socket.data.playerId = playerId;
  socket.data.roomCode = roomCode;
  socket.data.membershipToken = membershipToken;
  void socket.join(roomCode);
}

export function getAuthorizedRoom(
  socket: GameSocket,
  store: InMemoryRoomStore
): InternalRoom | null {
  const { roomCode, playerId, membershipToken } = socket.data;
  if (!roomCode || !playerId || !membershipToken) return null;
  const room = store.get(roomCode);
  if (!room || room.state === "CLOSED") return null;
  const player = room.players.get(playerId);
  if (!player || player.membershipToken !== membershipToken) return null;
  return room;
}
