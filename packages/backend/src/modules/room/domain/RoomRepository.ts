import type { Result } from "../../../shared/types";
import type { DomainError, Room, RoomEvent, RoomId } from "./Room";

// In Event Sourcing, the repository usually handles replaying events to build state
// and saving new events.

export interface RoomRepository {
  // Save new events for a given stream
  save(roomId: RoomId, events: RoomEvent[]): Promise<Result<void, DomainError>>;

  // Find room by replaying events
  findById(id: RoomId): Promise<Result<{ room: Room; version: number }, DomainError>>;
}
