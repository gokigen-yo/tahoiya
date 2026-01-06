import { ok, type Result } from "../../../shared/types";
import {
  type DomainError,
  decideCreateRoom,
  evolve,
  getInitialState,
  type Player,
  type Room,
  type RoomCreatedPayload,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

export class CreateRoomUseCase {
  constructor(private roomRepository: RoomRepository) {}

  async execute(playerName: string): Promise<Result<{ room: Room; player: Player }, DomainError>> {
    // 1. Decide: Generate events based on command (create room)
    const decision = decideCreateRoom(playerName);
    if (!decision.success) {
      return decision;
    }
    const events = decision.value;

    // 2. Evolve: Apply events to get the new state (for response)
    // For creation, we start with initial state.
    let state = getInitialState();
    for (const event of events) {
      state = evolve(state, event);
    }

    if (!state) {
      return {
        success: false,
        error: { type: "DomainError", message: "Failed to create room state" },
      };
    }

    const room = state;
    // Extract player info from event payload for response
    // In strict ES, we might just return the ID or the events.
    // But to keep API same, we reconstruct what we need.
    const createdEvent = events.find((e) => e.type === "RoomCreated");
    if (!createdEvent) {
      return {
        success: false,
        error: { type: "DomainError", message: "RoomCreated event missing" },
      };
    }
    const payload = createdEvent.payload as RoomCreatedPayload;

    // We already have the player in the evolved state
    const player = room.players.find((p) => p.id === payload.hostId);
    if (!player) {
      return {
        success: false,
        error: { type: "DomainError", message: "Host player not found in state" },
      };
    }

    // 3. Save: Persist events
    // For creation, expected version is 0 (or empty)
    const saveResult = await this.roomRepository.save(room.id, events, 0);

    if (!saveResult.success) {
      return saveResult;
    }

    return ok({ room, player });
  }
}
