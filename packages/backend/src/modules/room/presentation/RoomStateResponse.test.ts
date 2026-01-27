import { describe, expect, it } from "vitest";
import type {
  FinalResultRoom,
  MeaningInputRoom,
  RoundResultRoom,
  ThemeInputRoom,
  VotingRoom,
  WaitingForJoinRoom,
} from "../domain/Room";
import { toResponse } from "./RoomStateResponse";

// Helper to create base room properties
const createBaseRoom = () => ({
  id: "room-1",
  hostId: "player-1",
  players: [
    { id: "player-1", name: "Player 1", score: 0 },
    { id: "player-2", name: "Player 2", score: 0 },
  ],
});

describe("RoomStateResponseMapper", () => {
  it("プレイヤー待機中のレスポンスが正しくマッピングされる", () => {
    const room: WaitingForJoinRoom = {
      ...createBaseRoom(),
      phase: "waiting_for_join",
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "waiting_for_join",
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
      ],
    });
  });

  it("お題入力中のレスポンスが正しくマッピングされる", () => {
    const room: ThemeInputRoom = {
      ...createBaseRoom(),
      phase: "theme_input",
      round: 1,
      parentPlayerId: "player-1",
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "theme_input",
      round: 1,
      parentPlayerId: "player-1",
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
      ],
    });
  });

  it("意味入力中のレスポンスが正しくマッピングされる", () => {
    const room: MeaningInputRoom = {
      ...createBaseRoom(),
      phase: "meaning_input",
      round: 1,
      parentPlayerId: "player-1",
      theme: "Test Theme",
      meanings: [{ playerId: "player-2", text: "Meaning 1" }],
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "meaning_input",
      round: 1,
      parentPlayerId: "player-1",
      theme: "Test Theme",
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 0,
          hasSubmitted: false,
          hasVoted: undefined,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 0,
          hasSubmitted: true,
          hasVoted: undefined,
        },
      ],
    });
  });

  it("投票中のレスポンスが正しくマッピングされる", () => {
    const room: VotingRoom = {
      ...createBaseRoom(),
      phase: "voting",
      round: 1,
      parentPlayerId: "player-1",
      theme: "Test Theme",
      meanings: [
        { playerId: "player-2", text: "Meaning 1", choiceIndex: 0 },
        { playerId: "player-1", text: "Meaning 2", choiceIndex: 1 },
      ],
      votes: [],
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "voting",
      round: 1,
      parentPlayerId: "player-1",
      theme: "Test Theme",
      meanings: [
        { choiceIndex: 0, text: "Meaning 1" },
        { choiceIndex: 1, text: "Meaning 2" },
      ],
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: false,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: false,
        },
      ],
    });
  });

  it("ラウンド結果発表のレスポンスが正しくマッピングされる", () => {
    const room: RoundResultRoom = {
      ...createBaseRoom(),
      phase: "round_result",
      round: 1,
      parentPlayerId: "player-1",
      theme: "Test Theme",
      meanings: [{ playerId: "player-2", text: "Meaning 1", choiceIndex: 0 }],
      votes: [{ playerId: "player-1", choiceIndex: 0, betPoints: 1 }],
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "round_result",
      round: 1,
      parentPlayerId: "player-1",
      theme: "Test Theme",
      meanings: [{ choiceIndex: 0, text: "Meaning 1", authorId: "player-2" }],
      votes: [{ voterId: "player-1", choiceIndex: 0, betPoints: 1 }],
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 0,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
      ],
    });
  });

  it("最終結果発表中のレスポンスが正しくマッピングされる", () => {
    const room: FinalResultRoom = {
      ...createBaseRoom(),
      phase: "final_result",
      players: [
        { id: "player-1", name: "Player 1", score: 10 },
        { id: "player-2", name: "Player 2", score: 20 },
      ],
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "final_result",
      winnerIds: ["player-2"],
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 10,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 20,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
      ],
    });
  });

  it("最終結果で同点のプレイヤーがいた場合、全員優勝になる", () => {
    const room: FinalResultRoom = {
      ...createBaseRoom(),
      phase: "final_result",
      players: [
        { id: "player-1", name: "Player 1", score: 20 },
        { id: "player-2", name: "Player 2", score: 20 },
        { id: "player-3", name: "Player 3", score: 10 },
      ],
    };

    const response = toResponse(room);

    expect(response).toEqual({
      roomId: "room-1",
      hostId: "player-1",
      phase: "final_result",
      winnerIds: ["player-1", "player-2"],
      players: [
        {
          id: "player-1",
          name: "Player 1",
          score: 20,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
        {
          id: "player-2",
          name: "Player 2",
          score: 20,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
        {
          id: "player-3",
          name: "Player 3",
          score: 10,
          hasSubmitted: undefined,
          hasVoted: undefined,
        },
      ],
    });
  });
});
