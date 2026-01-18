import type { DomainEvent } from "../../../shared/event/DomainEvent";
import type { PlayerId, RoomId } from "./Room";

// --- Event Types Constants ---

export type RoomEventType =
  | "RoomCreated"
  | "PlayerJoined"
  | "GameStarted"
  | "ThemeInputted"
  | "MeaningListUpdated"
  | "VotingStarted"
  | "VoteSubmitted"
  | "ScoreUpdated"
  | "AllChildrenMissed"
  | "NextRoundStarted"
  | "GameEnded";

// --- Payloads ---

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

export type MeaningListUpdatedPayload = {
  readonly roomId: RoomId;
  readonly meanings: {
    readonly playerId: PlayerId;
    readonly text: string;
  }[];
};

export type VotingStartedPayload = {
  readonly roomId: RoomId;
  readonly meanings: {
    readonly playerId: PlayerId;
    readonly text: string;
    readonly choiceIndex: number;
  }[];
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

// --- Events ---

export type RoomCreated = DomainEvent<RoomCreatedPayload> & {
  type: "RoomCreated";
};
export type PlayerJoined = DomainEvent<PlayerJoinedPayload> & {
  type: "PlayerJoined";
};
export type GameStarted = DomainEvent<GameStartedPayload> & {
  type: "GameStarted";
};
export type ThemeInputted = DomainEvent<ThemeInputtedPayload> & {
  type: "ThemeInputted";
};
export type MeaningListUpdated = DomainEvent<MeaningListUpdatedPayload> & {
  type: "MeaningListUpdated";
};
export type VotingStarted = DomainEvent<VotingStartedPayload> & {
  type: "VotingStarted";
};
export type VoteSubmitted = DomainEvent<VoteSubmittedPayload> & {
  type: "VoteSubmitted";
};
export type ScoreUpdated = DomainEvent<ScoreUpdatedPayload> & {
  type: "ScoreUpdated";
};
export type AllChildrenMissed = DomainEvent<AllChildrenMissedPayload> & {
  type: "AllChildrenMissed";
};
export type NextRoundStarted = DomainEvent<NextRoundStartedPayload> & {
  type: "NextRoundStarted";
};
export type GameEnded = DomainEvent<GameEndedPayload> & { type: "GameEnded" };

export type RoomEvent =
  | RoomCreated
  | PlayerJoined
  | GameStarted
  | ThemeInputted
  | MeaningListUpdated
  | VotingStarted
  | VoteSubmitted
  | ScoreUpdated
  | AllChildrenMissed
  | NextRoundStarted
  | GameEnded;
