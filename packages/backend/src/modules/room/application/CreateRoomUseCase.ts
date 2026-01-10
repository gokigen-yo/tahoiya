import { v4 as uuidv4 } from "uuid";
import { ok, type Result } from "../../../shared/types";
import {
  type DomainError,
  decideCreateRoom,
  evolve,
  getInitialState,
  type PlayerId,
  type Room,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

export class CreateRoomUseCase {
  constructor(private roomRepository: RoomRepository) {}

  async execute(
    playerName: string,
  ): Promise<Result<{ room: Room; playerId: PlayerId }, DomainError>> {
    const roomId = uuidv4();
    const playerId = uuidv4();

    const decision = decideCreateRoom(roomId, playerId, playerName);
    if (!decision.success) {
      return decision;
    }
    const events = decision.value;

    let room = getInitialState();
    for (const event of events) {
      room = evolve(room, event);
    }

    if (!room) {
      return {
        success: false,
        error: { type: "DomainError", message: "Failed to create room state" },
      };
    }

    const saveResult = await this.roomRepository.save(room.id, events);

    if (!saveResult.success) {
      return saveResult;
    }

    return ok({ room, playerId });
  }
}
