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
  players: Player[];
  hostId: PlayerId;
};

export type WaitingForJoinRoom = BaseRoom & {
  phase: "waiting_for_join";
};

export type ThemeInputRoom = BaseRoom & {
  phase: "theme_input";
  round: number;
  parentPlayerId: PlayerId;
};

export type MeaningInputRoom = BaseRoom & {
  phase: "meaning_input";
  round: number;
  parentPlayerId: PlayerId;
  theme: string;
  meanings: {
    playerId: PlayerId;
    text: string;
  }[];
};

export type VotingRoom = BaseRoom & {
  phase: "voting";
  round: number;
  parentPlayerId: PlayerId;
  theme: string;
  meanings: {
    playerId: PlayerId;
    text: string;
    choiceIndex: number;
  }[];
  votes: {
    playerId: PlayerId;
    choiceIndex: number;
    betPoints: number;
  }[];
};

export type RoundResultRoom = BaseRoom & {
  phase: "round_result";
  round: number;
  parentPlayerId: PlayerId;
  theme: string;
  meanings: {
    playerId: PlayerId;
    text: string;
    choiceIndex: number;
  }[];
  votes: {
    playerId: PlayerId;
    choiceIndex: number;
    betPoints: number;
  }[];
};

export type FinalResultRoom = BaseRoom & {
  phase: "final_result";
};

export type Room =
  | WaitingForJoinRoom
  | ThemeInputRoom
  | MeaningInputRoom
  | VotingRoom
  | RoundResultRoom
  | FinalResultRoom;

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

export type GameStartedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
};

export type ThemeInputtedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
  theme: string;
};

export type MeaningInputtedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
  theme: string;
  meaning: string;
};

export type VoteSubmittedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
  theme: string;
  choiceIndex: number;
  betPoints: number;
};

export type ScoreUpdatedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
  betPoints: number;
  meaningSubmittedPlayerId: PlayerId;
  isChoosingCorrectMeaning: boolean;
  parentPlayerId: PlayerId;
};

export type AllChildrenMissedPayload = {
  roomId: RoomId;
  parentPlayerId: PlayerId;
  gainedPoints: number;
};

export type NextRoundStartedPayload = {
  roomId: RoomId;
  playerId: PlayerId;
};

export type GameEndedPayload = {
  roomId: RoomId;
};

export type RoomCreated = DomainEvent<RoomCreatedPayload>;
export type PlayerJoined = DomainEvent<PlayerJoinedPayload>;
export type GameStarted = DomainEvent<GameStartedPayload>;
export type ThemeInputted = DomainEvent<ThemeInputtedPayload>;
export type MeaningInputted = DomainEvent<MeaningInputtedPayload>;
export type VoteSubmitted = DomainEvent<VoteSubmittedPayload>;
export type ScoreUpdated = DomainEvent<ScoreUpdatedPayload>;
export type AllChildrenMissed = DomainEvent<AllChildrenMissedPayload>;
export type NextRoundStarted = DomainEvent<NextRoundStartedPayload>;
export type GameEnded = DomainEvent<GameEndedPayload>;

export type RoomEvent =
  | RoomCreated
  | PlayerJoined
  | GameStarted
  | ThemeInputted
  | MeaningInputted
  | VoteSubmitted
  | ScoreUpdated
  | AllChildrenMissed
  | NextRoundStarted
  | GameEnded;

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

  const event: RoomCreated = createEvent(
    "RoomCreated",
    {
      roomId,
      hostId,
      hostName: playerName,
    },
    1,
  );

  return ok([event]);
};

export const decideJoinRoom = (
  room: Room,
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

  const playerId = uuidv4();

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

      const newRoom: WaitingForJoinRoom = {
        id: roomId,
        phase: "waiting_for_join",
        players: [hostPlayer],
        hostId,
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
      };
    }
    default:
      return state as Room; // Should not happen if types are correct
  }
};
