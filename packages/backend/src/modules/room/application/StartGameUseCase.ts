import { err, ok, type Result } from "../../../shared/types";
import {
  type DomainError,
  decideStartGame,
  evolve,
  type PlayerId,
  type Room,
  type RoomId,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

type StartGameInput = {
  roomId: RoomId;
  playerId: PlayerId;
};

export class StartGameUseCase {
  constructor(private roomRepository: RoomRepository) {}

  async execute(input: StartGameInput): Promise<Result<{ room: Room }, DomainError>> {
    const { roomId, playerId } = input;
    const roomResult = await this.roomRepository.findById(roomId);

    if (!roomResult.success) {
      return err(roomResult.error);
    }
    const { room, version: currentVersion } = roomResult.value;

    if (!room) {
      return err({ type: "DomainError", message: "Room not found" });
    }

    const decision = decideStartGame(room, playerId, currentVersion);
    if (!decision.success) {
      return decision;
    }
    const events = decision.value;

    let updatedRoom = room;
    for (const event of events) {
      updatedRoom = evolve(updatedRoom, event);
    }

    const saveResult = await this.roomRepository.save(updatedRoom.id, events);

    if (!saveResult.success) {
      return saveResult;
    }

    return ok({ room: updatedRoom });
  }
}
