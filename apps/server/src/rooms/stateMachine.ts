import type { RoomState } from "@partyverse/shared";
import type { InternalRoom } from "./types";
import { VALID_TRANSITIONS } from "./types";

export function canTransition(from: RoomState, to: RoomState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function transition(room: InternalRoom, to: RoomState): void {
  if (!canTransition(room.state, to)) {
    throw new Error(`Invalid transition ${room.state} → ${to}`);
  }
  room.state = to;
  room.updatedAt = Date.now();
}

export function clearTimer(room: InternalRoom): void {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}
