import { err, ok, type Result } from "../../../shared/types";
import {
  type DomainError,
  decideVote,
  evolve,
  type PlayerId,
  type Room,
  type RoomId,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

type VoteInput = {
  roomId: RoomId;
  playerId: PlayerId;
  choiceIndex: number;
  betPoints: number;
};

export class VoteUseCase {
  constructor(private roomRepository: RoomRepository) {}

  async execute(input: VoteInput): Promise<Result<{ room: Room }, DomainError>> {
    const { roomId, playerId, choiceIndex, betPoints } = input;
    const roomResult = await this.roomRepository.findById(roomId);

    if (!roomResult.success) {
      return err(roomResult.error);
    }
    const { room, version: currentVersion } = roomResult.value;

    if (!room) {
      return err({ type: "DomainError", message: "Room not found" });
    }

    const decision = decideVote(room, playerId, choiceIndex, betPoints, currentVersion);
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
