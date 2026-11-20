import type { InternalRoom } from "./types";

export interface RoomStore {
  get(code: string): InternalRoom | undefined;
  set(room: InternalRoom): void;
  delete(code: string): void;
  values(): IterableIterator<InternalRoom>;
}

export class InMemoryRoomStore implements RoomStore {
  private rooms = new Map<string, InternalRoom>();

  get(code: string): InternalRoom | undefined {
    return this.rooms.get(code);
  }

  set(room: InternalRoom): void {
    this.rooms.set(room.code, room);
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  values(): IterableIterator<InternalRoom> {
    return this.rooms.values();
  }
}
