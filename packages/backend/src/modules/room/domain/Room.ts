// --- Constants ---

export const INITIAL_PLAYER_SCORE = 10;

// --- Value Objects ---

export type PlayerId = string;
export type RoomId = string;

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

// --- Re-exports ---

export * from "./RoomDecider";
export * from "./RoomEvents";
export * from "./RoomEvolver";
