import type { DomainEvent } from "../../../shared/event/DomainEvent";
import type { PlayerId, RoomId } from "./Room";

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
