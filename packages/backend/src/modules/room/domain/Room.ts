import { v4 as uuidv4 } from "uuid";
import { createEvent, type DomainEvent } from "../../../shared/event/DomainEvent";
import { err, ok, type Result } from "../../../shared/types";

// --- Constants ---

export const INITIAL_PLAYER_SCORE = 10;

// --- Value Objects ---

export type RoomId = string;
export type PlayerId = string;

// --- Entity Types (Discriminated Unions) ---

export type Player = {
  id: PlayerId;
  name: string;
  score: number;
};

// Base properties common to all rooms
type BaseRoom = {
  id: RoomId;
  round: number;
  players: Player[];
  hostId: PlayerId;
  version: number;
};

export type WaitingRoom = BaseRoom & {
  phase: "waiting";
};

export type Room = WaitingRoom; // Union of all room types

// --- Events ---

export type RoomCreatedPayload = {
  roomId: RoomId;
  hostId: PlayerId;
  hostName: string;
};

export type PlayerJoinedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
  playerName: string;
};

export type RoomCreated = DomainEvent<RoomCreatedPayload>;

export type PlayerJoined = DomainEvent<PlayerJoinedPayload>;

export type RoomEvent = RoomCreated | PlayerJoined; // Union of all room events

// --- Domain Errors ---

export type DomainError = {
  type: "DomainError";
  message: string;
};

// --- Decider (Command -> Events) ---

export const decideCreateRoom = (playerName: string): Result<RoomEvent[], DomainError> => {
  if (!playerName) {
    return err({ type: "DomainError", message: "Player name is required" });
  }

  const roomId = uuidv4();
  const hostId = uuidv4();

  const event: RoomCreated = createEvent("RoomCreated", {
    roomId,
    hostId,
    hostName: playerName,
  });

  return ok([event]);
};

export const decideJoinRoom = (
  room: Room,
  playerName: string,
): Result<RoomEvent[], DomainError> => {
  if (room.phase !== "waiting") {
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

  const playerId = uuidv4();

  const event: PlayerJoined = createEvent("PlayerJoined", {
    roomId: room.id,
    playerId,
    playerName,
  });

  return ok([event]);
};

// --- Evolver (State + Event -> State) ---

export const getInitialState = (): Room | null => null;

export const evolve = (state: Room | null, event: RoomEvent): Room => {
  switch (event.type) {
    case "RoomCreated": {
      const { roomId, hostId, hostName } = event.payload as RoomCreatedPayload;
      const hostPlayer: Player = {
        id: hostId,
        name: hostName,
        score: INITIAL_PLAYER_SCORE,
      };

      const newRoom: WaitingRoom = {
        id: roomId,
        phase: "waiting",
        round: 1,
        players: [hostPlayer],
        hostId,
        version: 1,
      };
      return newRoom;
    }
    case "PlayerJoined": {
      const { playerId, playerName } = event.payload as PlayerJoinedPayload;
      if (!state) {
        throw new Error("Cannot join a non-existent room");
      }

      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        score: INITIAL_PLAYER_SCORE,
      };

      return {
        ...state,
        players: [...state.players, newPlayer],
        version: state.version + 1,
      };
    }
    default:
      return state as Room; // Should not happen if types are correct
  }
};
