import { createEvent, type DomainEvent } from "../../../shared/event/DomainEvent";
import { err, ok, type Result } from "../../../shared/types";

// --- Constants ---

export const INITIAL_PLAYER_SCORE = 10;

// --- Value Objects ---

export type RoomId = string;
export type PlayerId = string;

// --- Entity Types (Discriminated Unions) ---

export type Player = {
  readonly id: PlayerId;
  readonly name: string;
  readonly score: number;
};

// Base properties common to all rooms
type BaseRoom = {
  readonly id: RoomId;
  readonly players: Player[];
  readonly hostId: PlayerId;
};

export type WaitingForJoinRoom = BaseRoom & {
  readonly phase: "waiting_for_join";
};

export type ThemeInputRoom = BaseRoom & {
  readonly phase: "theme_input";
  readonly round: number;
  readonly parentPlayerId: PlayerId;
};

export type MeaningInputRoom = BaseRoom & {
  readonly phase: "meaning_input";
  readonly round: number;
  readonly parentPlayerId: PlayerId;
  readonly theme: string;
  readonly meanings: {
    readonly playerId: PlayerId;
    readonly text: string;
  }[];
};

export type VotingRoom = BaseRoom & {
  readonly phase: "voting";
  readonly round: number;
  readonly parentPlayerId: PlayerId;
  readonly theme: string;
  readonly meanings: {
    readonly playerId: PlayerId;
    readonly text: string;
    readonly choiceIndex: number;
  }[];
  readonly votes: {
    readonly playerId: PlayerId;
    readonly choiceIndex: number;
    readonly betPoints: number;
  }[];
};

export type RoundResultRoom = BaseRoom & {
  readonly phase: "round_result";
  readonly round: number;
  readonly parentPlayerId: PlayerId;
  readonly theme: string;
  readonly meanings: {
    readonly playerId: PlayerId;
    readonly text: string;
    readonly choiceIndex: number;
  }[];
  readonly votes: {
    readonly playerId: PlayerId;
    readonly choiceIndex: number;
    readonly betPoints: number;
  }[];
};

export type FinalResultRoom = BaseRoom & {
  readonly phase: "final_result";
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
  readonly roomId: RoomId;
  readonly hostId: PlayerId;
  readonly hostName: string;
};

export type PlayerJoinedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
  readonly playerName: string;
};

export type GameStartedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
};

export type ThemeInputtedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
  readonly theme: string;
};

export type MeaningInputtedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
  readonly theme: string;
  readonly meaning: string;
};

export type VoteSubmittedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
  readonly theme: string;
  readonly choiceIndex: number;
  readonly betPoints: number;
};

export type ScoreUpdatedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
  readonly betPoints: number;
  readonly meaningSubmittedPlayerId: PlayerId;
  readonly isChoosingCorrectMeaning: boolean;
  readonly parentPlayerId: PlayerId;
};

export type AllChildrenMissedPayload = {
  readonly roomId: RoomId;
  readonly parentPlayerId: PlayerId;
  readonly gainedPoints: number;
};

export type NextRoundStartedPayload = {
  readonly roomId: RoomId;
  readonly playerId: PlayerId;
};

export type GameEndedPayload = {
  readonly roomId: RoomId;
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
  readonly type: "DomainError";
  readonly message: string;
};

// --- Decider (Command -> Events) ---

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

    case "GameStarted": {
      if (!state) {
        throw new Error("Cannot start game for non-existent room");
      }

      const newRoom: ThemeInputRoom = {
        ...state,
        phase: "theme_input",
        round: 1,
        parentPlayerId: state.hostId,
      };

      return newRoom;
    }
    default:
      return state as Room; // Should not happen if types are correct
  }
};
