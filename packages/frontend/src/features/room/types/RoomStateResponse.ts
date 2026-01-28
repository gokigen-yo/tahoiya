// WebSocket API (Section 6.1) に基づく型定義

type BasePlayer = {
  id: string;
  name: string;
  score: number;
};

type PlayerWithSubmissionStatus = BasePlayer & {
  hasSubmitted: boolean;
};

type PlayerWithVotingStatus = BasePlayer & {
  hasVoted: boolean;
};

type Meaning = {
  choiceIndex: number;
  text: string;
};

type MeaningWithAuthor = Meaning & {
  authorId: string;
};

type Vote = {
  voterId: string;
  choiceIndex: number;
  betPoints: number;
};

export type WaitingForJoinState = {
  phase: "waiting_for_join";
  roomId: string;
  hostId: string;
  players: BasePlayer[];
};

export type ThemeInputState = {
  phase: "theme_input";
  roomId: string;
  hostId: string;
  players: BasePlayer[];
  round: number;
  parentPlayerId: string;
};

export type MeaningInputState = {
  phase: "meaning_input";
  roomId: string;
  hostId: string;
  players: PlayerWithSubmissionStatus[];
  round: number;
  parentPlayerId: string;
  theme: string;
};

export type VotingState = {
  phase: "voting";
  roomId: string;
  hostId: string;
  players: PlayerWithVotingStatus[];
  round: number;
  parentPlayerId: string;
  theme: string;
  meanings: Meaning[];
};

export type RoundResultState = {
  phase: "round_result";
  roomId: string;
  hostId: string;
  players: BasePlayer[];
  round: number;
  parentPlayerId: string;
  theme: string;
  meanings: MeaningWithAuthor[];
  votes: Vote[];
};

export type FinalResultState = {
  phase: "final_result";
  roomId: string;
  hostId: string;
  players: BasePlayer[];
  winnerIds: string[];
};

export type RoomStateResponse =
  | WaitingForJoinState
  | ThemeInputState
  | MeaningInputState
  | VotingState
  | RoundResultState
  | FinalResultState;
