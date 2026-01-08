import type { Result } from "../../../shared/types";
import { err, ok } from "../../../shared/types";
import {
  type DomainError,
  decideJoinRoom,
  evolve,
  type PlayerId,
  type PlayerJoined,
  type Room,
  type RoomId,
} from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";

type JoinRoomRequest = {
  roomId: RoomId;
  playerName: string;
  playerId?: PlayerId;
};

type JoinRoomResponse = {
  room: Room;
  playerId: PlayerId;
};

export class JoinRoomUseCase {
  constructor(private roomRepository: RoomRepository) {}

  async execute(request: JoinRoomRequest): Promise<Result<JoinRoomResponse, DomainError>> {
    const { roomId, playerName, playerId } = request;

    const roomResult = await this.roomRepository.findById(roomId);
    if (!roomResult.success) {
      return err(roomResult.error);
    }
    const room = roomResult.value;

    // Re-join scenario
    if (playerId) {
      const existingPlayer = room.players.find((p) => p.id === playerId);
      if (existingPlayer) {
        // Idempotent success (just return current state)
        return ok({ room, playerId });
      }
      return err({ type: "DomainError", message: "Player not found in room" });
    }

    // New join scenario
    const decision = decideJoinRoom(room, playerName);
    if (!decision.success) {
      return err(decision.error);
    }

    const events = decision.value;
    const saveResult = await this.roomRepository.save(room.id, events, room.version);

    if (!saveResult.success) {
      return saveResult;
    }

    // Evolve state to return updated room
    let updatedRoom = room;
    for (const event of events) {
      updatedRoom = evolve(updatedRoom, event);
    }

    // Extract new player ID from event to return
    const joinedEvent = events.find((e) => e.type === "PlayerJoined") as PlayerJoined | undefined;
    if (!joinedEvent) {
      return err({ type: "DomainError", message: "PlayerJoined event missing" });
    }
    const { playerId: newPlayerId } = joinedEvent.payload;

    return ok({ room: updatedRoom, playerId: newPlayerId });
  }
}
