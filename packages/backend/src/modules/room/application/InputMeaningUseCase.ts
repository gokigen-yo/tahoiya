import { err, ok, type Result } from "../../../shared/types";
import {
  type DomainError,
  decideInputMeaning,
  evolve,
  type PlayerId,
  type Room,
  type RoomId,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

type InputMeaningInput = {
  roomId: RoomId;
  playerId: PlayerId;
  meaning: string;
};

export class InputMeaningUseCase {
  constructor(private roomRepository: RoomRepository) {}

  async execute(input: InputMeaningInput): Promise<Result<{ room: Room }, DomainError>> {
    const { roomId, playerId, meaning } = input;
    const roomResult = await this.roomRepository.findById(roomId);

    if (!roomResult.success) {
      return err(roomResult.error);
    }
    const { room, version: currentVersion } = roomResult.value;

    if (!room) {
      return err({ type: "DomainError", message: "Room not found" });
    }

    // Generate random seed for shuffling if this is the last meaning
    // The domain logic handles when to use it, we just provide it.
    const randomSeed = Math.floor(Math.random() * 1000000);

    const decision = decideInputMeaning(room, playerId, meaning, currentVersion, randomSeed);
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
