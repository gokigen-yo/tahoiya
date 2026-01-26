import type { Room } from "../domain/Room";

type RoomResponsePlayer = {
  id: string;
  name: string;
  score: number;
  hasSubmitted?: boolean;
  hasVoted?: boolean;
};

type RoomStateResponseBase = {
  roomId: string;
  hostId: string;
  players: RoomResponsePlayer[];
};

type WaitingForJoinRoomResponse = RoomStateResponseBase & {
  phase: "waiting_for_join";
};

type ThemeInputRoomResponse = RoomStateResponseBase & {
  phase: "theme_input";
  round: number;
  parentPlayerId: string;
};

type MeaningInputRoomResponse = RoomStateResponseBase & {
  phase: "meaning_input";
  round: number;
  parentPlayerId: string;
  theme: string;
};

type VotingRoomResponse = RoomStateResponseBase & {
  phase: "voting";
  round: number;
  parentPlayerId: string;
  theme: string;
  meanings: {
    choiceIndex: number;
    text: string;
  }[];
};

type RoundResultRoomResponse = RoomStateResponseBase & {
  phase: "round_result";
  round: number;
  parentPlayerId: string;
  theme: string;
  meanings: {
    choiceIndex: number;
    text: string;
    authorId: string;
  }[];
  votes: {
    voterId: string;
    choiceIndex: number;
    betPoints: number;
  }[];
};

type FinalResultRoomResponse = RoomStateResponseBase & {
  phase: "final_result";
  winnerIds: string[];
};

type RoomStateResponse =
  | WaitingForJoinRoomResponse
  | ThemeInputRoomResponse
  | MeaningInputRoomResponse
  | VotingRoomResponse
  | RoundResultRoomResponse
  | FinalResultRoomResponse;

const mapPlayers = (room: Room): RoomResponsePlayer[] => {
  return room.players.map((p) => {
    const hasSubmitted: boolean | undefined =
      room.phase === "meaning_input" ? room.meanings.some((m) => m.playerId === p.id) : undefined;

    const hasVoted: boolean | undefined =
      room.phase === "voting" ? room.votes.some((v) => v.playerId === p.id) : undefined;

    return {
      id: p.id,
      name: p.name,
      score: p.score,
      hasSubmitted,
      hasVoted,
    };
  });
};

export const toResponse = (room: Room): RoomStateResponse => {
  const players = mapPlayers(room);

  switch (room.phase) {
    case "waiting_for_join":
      return {
        roomId: room.id,
        hostId: room.hostId,
        players,
        phase: "waiting_for_join",
      };

    case "theme_input":
      return {
        roomId: room.id,
        hostId: room.hostId,
        players,
        phase: "theme_input",
        round: room.round,
        parentPlayerId: room.parentPlayerId,
      };

    case "meaning_input":
      return {
        roomId: room.id,
        hostId: room.hostId,
        players,
        phase: "meaning_input",
        round: room.round,
        parentPlayerId: room.parentPlayerId,
        theme: room.theme,
      };

    case "voting":
      return {
        roomId: room.id,
        hostId: room.hostId,
        players,
        phase: "voting",
        round: room.round,
        parentPlayerId: room.parentPlayerId,
        theme: room.theme,
        meanings: room.meanings.map((m) => ({
          choiceIndex: m.choiceIndex,
          text: m.text,
        })),
      };

    case "round_result":
      return {
        roomId: room.id,
        hostId: room.hostId,
        players,
        phase: "round_result",
        round: room.round,
        parentPlayerId: room.parentPlayerId,
        theme: room.theme,
        meanings: room.meanings.map((m) => ({
          choiceIndex: m.choiceIndex,
          text: m.text,
          authorId: m.playerId,
        })),
        votes: room.votes.map((v) => ({
          voterId: v.playerId,
          choiceIndex: v.choiceIndex,
          betPoints: v.betPoints,
        })),
      };

    case "final_result": {
      const maxScore = Math.max(...room.players.map((p) => p.score));
      const winnerIds = room.players.filter((p) => p.score === maxScore).map((p) => p.id);

      return {
        roomId: room.id,
        hostId: room.hostId,
        players,
        phase: "final_result",
        winnerIds,
      };
    }
  }
};
