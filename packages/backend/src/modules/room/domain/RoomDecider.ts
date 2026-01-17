import { createEvent } from "../../../shared/event/DomainEvent";
import { err, ok, type Result } from "../../../shared/types";
import type { PlayerId, Room, RoomId } from "./Room";
import type { GameStarted, PlayerJoined, RoomCreated, RoomEvent } from "./RoomEvents";

export type DomainError = {
  readonly type: "DomainError";
  readonly message: string;
};

export const decideCreateRoom = (
  roomId: RoomId,
  playerId: PlayerId,
  playerName: string,
): Result<RoomEvent[], DomainError> => {
  if (!playerName) {
    return err({ type: "DomainError", message: "Player name is required" });
  }

  const event: RoomCreated = createEvent(
    "RoomCreated",
    {
      roomId,
      hostId: playerId,
      hostName: playerName,
    },
    1,
  );

  return ok([event]);
};

export const decideJoinRoom = (
  room: Room,
  playerId: PlayerId,
  playerName: string,
  currentVersion: number,
): Result<RoomEvent[], DomainError> => {
  if (room.phase !== "waiting_for_join") {
    return err({
      type: "DomainError",
      message: "Room is not in waiting phase",
    });
  }

  if (room.players.length >= 8) {
    return err({ type: "DomainError", message: "Room is full" });
  }

  if (!playerName) {
    return err({ type: "DomainError", message: "Player name is required" });
  }

  const event: PlayerJoined = createEvent(
    "PlayerJoined",
    {
      roomId: room.id,
      playerId,
      playerName,
    },
    currentVersion + 1,
  );

  return ok([event]);
};

export const decideStartGame = (
  room: Room,
  playerId: PlayerId,
  currentVersion: number,
): Result<RoomEvent[], DomainError> => {
  if (room.phase !== "waiting_for_join") {
    return err({
      type: "DomainError",
      message: "Room is not in waiting phase",
    });
  }

  if (room.hostId !== playerId) {
    return err({
      type: "DomainError",
      message: "Only host can start the game",
    });
  }

  if (room.players.length < 3) {
    return err({
      type: "DomainError",
      message: "At least 3 players are required to start the game",
    });
  }

  const event: GameStarted = createEvent(
    "GameStarted",
    {
      roomId: room.id,
      playerId,
    },
    currentVersion + 1,
  );

  return ok([event]);
};
