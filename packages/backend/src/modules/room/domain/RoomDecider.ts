import { createEvent } from "../../../shared/event/DomainEvent";
import { err, ok, type Result } from "../../../shared/types";
import type { PlayerId, Room, RoomId } from "./Room";
import type {
  GameStarted,
  MeaningInputted,
  PlayerJoined,
  RoomCreated,
  RoomEvent,
  ThemeInputted,
} from "./RoomEvents";

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

  const event = createEvent(
    "RoomCreated",
    {
      roomId,
      hostId: playerId,
      hostName: playerName,
    },
    1,
  ) as RoomCreated;

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

  const event = createEvent(
    "PlayerJoined",
    {
      roomId: room.id,
      playerId,
      playerName,
    },
    currentVersion + 1,
  ) as PlayerJoined;

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

  const event = createEvent(
    "GameStarted",
    {
      roomId: room.id,
      playerId,
    },
    currentVersion + 1,
  ) as GameStarted;

  return ok([event]);
};

export const decideInputTheme = (
  room: Room,
  playerId: PlayerId,
  theme: string,
  currentVersion: number,
): Result<RoomEvent[], DomainError> => {
  if (room.phase !== "theme_input") {
    return err({
      type: "DomainError",
      message: "Room is not in theme input phase",
    });
  }

  if (room.parentPlayerId !== playerId) {
    return err({
      type: "DomainError",
      message: "Only parent can input theme",
    });
  }

  if (!theme) {
    return err({
      type: "DomainError",
      message: "Theme is required",
    });
  }

  const event = createEvent(
    "ThemeInputted",
    {
      roomId: room.id,
      playerId,
      theme,
    },
    currentVersion + 1,
  ) as ThemeInputted;

  return ok([event]);
};

export const decideInputMeaning = (
  room: Room,
  playerId: PlayerId,
  meaning: string,
  currentVersion: number,
): Result<RoomEvent[], DomainError> => {
  if (room.phase !== "meaning_input") {
    return err({
      type: "DomainError",
      message: "Room is not in meaning input phase",
    });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    return err({
      type: "DomainError",
      message: "Player is not in the room",
    });
  }

  const isAlreadySubmitted = room.meanings.some((m) => m.playerId === playerId);
  if (isAlreadySubmitted) {
    return err({
      type: "DomainError",
      message: "Player has already submitted a meaning",
    });
  }

  if (!meaning) {
    return err({
      type: "DomainError",
      message: "Meaning is required",
    });
  }

  const event = createEvent(
    "MeaningInputted",
    {
      roomId: room.id,
      playerId,
      theme: room.theme,
      meaning,
    },
    currentVersion + 1,
  ) as MeaningInputted;

  return ok([event]);
};
