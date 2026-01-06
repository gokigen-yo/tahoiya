import { v4 as uuidv4 } from "uuid";
import { createEvent, type DomainEvent } from "../../../shared/event/DomainEvent";
import { err, ok, type Result } from "../../../shared/types";

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
};

export type WaitingRoom = BaseRoom & {
  phase: "waiting";
  // parentPlayerId is not set in waiting phase
};

export type Room = WaitingRoom;

// --- Events ---

export type RoomCreatedPayload = {
  roomId: RoomId;
  hostId: PlayerId;
  hostName: string;
};

export type RoomCreated = DomainEvent<RoomCreatedPayload>;

export type RoomEvent = RoomCreated; // Union of all room events

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

// --- Evolver (State + Event -> State) ---

export const getInitialState = (): Room | null => null;

export const evolve = (state: Room | null, event: RoomEvent): Room => {
  switch (event.type) {
    case "RoomCreated": {
      const { roomId, hostId, hostName } = event.payload as RoomCreatedPayload;
      const hostPlayer: Player = {
        id: hostId,
        name: hostName,
        score: 0,
      };

      const newRoom: WaitingRoom = {
        id: roomId,
        phase: "waiting",
        round: 1,
        players: [hostPlayer],
        hostId,
      };
      return newRoom;
    }
    default:
      return state as Room; // Should not happen if types are correct
  }
};
