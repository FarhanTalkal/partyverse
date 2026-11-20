import type { InternalRoom } from "../rooms/types";

export type BroadcastFn = (room: InternalRoom) => void;

export interface GameController {
  startRound(room: InternalRoom, broadcast: BroadcastFn): Promise<void>;
  endRound(room: InternalRoom, broadcast: BroadcastFn): Promise<void>;
}
