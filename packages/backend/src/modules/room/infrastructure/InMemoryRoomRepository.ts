import type { EventStore } from "../../../shared/infrastructure/EventStore";
import { err, ok, type Result } from "../../../shared/types";
import {
  type DomainError,
  evolve,
  getInitialState,
  type Room,
  type RoomEvent,
  type RoomId,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

export class InMemoryRoomRepository implements RoomRepository {
  constructor(private eventStore: EventStore) {}

  async save(
    roomId: RoomId,
    events: RoomEvent[],
    expectedEventCount: number,
  ): Promise<Result<void, DomainError>> {
    try {
      await this.eventStore.save(roomId, events, expectedEventCount);
      return ok(undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error during save";
      return err({ type: "DomainError", message });
    }
  }

  async findById(roomId: RoomId): Promise<Result<Room, DomainError>> {
    const events = await this.eventStore.load(roomId);
    if (events.length === 0) {
      return err({ type: "DomainError", message: "Room not found" });
    }

    let state = getInitialState();
    for (const event of events) {
      // Cast generic DomainEvent to RoomEvent if we had runtime checks.
      // For now we assume the stream only contains RoomEvents.
      state = evolve(state, event as RoomEvent);
    }

    if (!state) {
      return err({ type: "DomainError", message: "Room state invalid" });
    }

    return ok(state);
  }
}
