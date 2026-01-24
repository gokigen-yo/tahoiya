import { describe, expect, it } from "vitest";
import type {
  MeaningInputRoom,
  RoundResultRoom,
  ThemeInputRoom,
  VotingRoom,
  WaitingForJoinRoom,
} from "./Room";
import type {
  AllChildrenMissed,
  GameEnded,
  GameStarted,
  MeaningListUpdated,
  NextRoundStarted,
  PlayerJoined,
  RoomCreated,
  RoundResultAnnounced,
  ScoreUpdated,
  ThemeInputted,
  VoteListUpdated,
  VotingStarted,
} from "./RoomEvents";
import { evolve } from "./RoomEvolver";

describe("evolve", () => {
  it("RoomCreatedイベントからWaitingForJoinRoomを作成する", () => {
    const roomId = "room-123";
    const hostId = "player-123";
    const event: RoomCreated = {
      type: "RoomCreated",
      payload: {
        roomId,
        hostId,
        hostName: "HostName",
      },
      occurredAt: new Date(),
      version: 1,
    };

    const newState = evolve(null, event) as WaitingForJoinRoom;

    expect(newState).toBeDefined();
    expect(newState.id).toBe(roomId);
    expect(newState.phase).toBe("waiting_for_join");
    expect(newState.hostId).toBe(hostId);
    expect(newState.players).toHaveLength(1);
    expect(newState.players[0].id).toBe(hostId);
    expect(newState.players[0].name).toBe("HostName");
    expect(newState.players[0].score).toBe(10);
  });

  it("PlayerJoinedイベントでプレイヤーが追加される", () => {
    // Arrange: Initial room state
    const roomId = "room-123";
    const hostId = "host-123";
    const hostPlayer = { id: hostId, name: "Host", score: 10 };
    const initialState: WaitingForJoinRoom = {
      id: roomId,
      phase: "waiting_for_join",
      players: [hostPlayer],
      hostId,
    };

    const newPlayerId = "player-456";
    const event: PlayerJoined = {
      type: "PlayerJoined",
      payload: {
        roomId,
        playerId: newPlayerId,
        playerName: "NewPlayer",
      },
      occurredAt: new Date(),
      version: 2,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.players).toHaveLength(2);
    expect(newState.players[1].name).toBe("NewPlayer");
    expect(newState.players[1].score).toBe(10);
  });

  it("GameStartedイベントでゲームが開始される", () => {
    // Arrange
    const roomId = "room-1";
    const hostId = "host";
    const initialState: WaitingForJoinRoom = {
      id: roomId,
      phase: "waiting_for_join",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
    };

    const event: GameStarted = {
      type: "GameStarted",
      payload: {
        roomId,
        playerId: hostId,
      },
      occurredAt: new Date(),
      version: 2,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.phase).toBe("theme_input");
    const themeInputRoom = newState as Extract<typeof newState, { phase: "theme_input" }>;
    expect(themeInputRoom.round).toBe(1);
    expect(themeInputRoom.parentPlayerId).toBe(hostId);
  });

  it("ThemeInputtedイベントで意味入力フェーズに遷移する", () => {
    // Arrange
    const roomId = "room-1";
    const hostId = "host";
    const initialState: ThemeInputRoom = {
      id: roomId,
      phase: "theme_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
    };

    const theme = "お題";
    const event: ThemeInputted = {
      type: "ThemeInputted",
      payload: {
        roomId,
        playerId: hostId,
        theme,
      },
      occurredAt: new Date(),
      version: 3,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.phase).toBe("meaning_input");
    const meaningInputRoom = newState as Extract<typeof newState, { phase: "meaning_input" }>;
    expect(meaningInputRoom.theme).toBe(theme);
    expect(meaningInputRoom.meanings).toEqual([]);
  });

  it("MeaningListUpdatedイベントで意味が追加される", () => {
    // Arrange
    const roomId = "room-1";
    const hostId = "host";
    const playerId = "p2";
    const initialState: MeaningInputRoom = {
      id: roomId,
      phase: "meaning_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: playerId, name: "P2", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [],
    };

    const event: MeaningListUpdated = {
      type: "MeaningListUpdated",
      payload: {
        roomId,
        meanings: [{ playerId, text: "意味" }],
      },
      occurredAt: new Date(),
      version: 4,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    const meaningInputRoom = newState as Extract<typeof newState, { phase: "meaning_input" }>;
    expect(meaningInputRoom.meanings).toHaveLength(1);
    expect(meaningInputRoom.meanings[0].playerId).toBe(playerId);
    expect(meaningInputRoom.meanings[0].text).toBe("意味");
  });

  it("VotingStartedイベントで投票フェーズに遷移する", () => {
    // Arrange
    const roomId = "room-1";
    const hostId = "host";
    const initialState: MeaningInputRoom = {
      id: roomId,
      phase: "meaning_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [
        { playerId: hostId, text: "意味1" },
        { playerId: "p2", text: "意味2" },
      ],
    };

    const event: VotingStarted = {
      type: "VotingStarted",
      payload: {
        roomId,
        meanings: [
          { playerId: hostId, text: "意味1", choiceIndex: 0 },
          { playerId: "p2", text: "意味2", choiceIndex: 1 },
        ],
      },
      occurredAt: new Date(),
      version: 5,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.phase).toBe("voting");
    const votingRoom = newState as VotingRoom;
    expect(votingRoom.meanings).toHaveLength(2);
    expect(votingRoom.meanings[0].choiceIndex).toBe(0);
    expect(votingRoom.meanings[1].choiceIndex).toBe(1);
    expect(votingRoom.votes).toEqual([]);
  });

  it("VoteListUpdatedで投票リストが更新される", () => {
    // Arrange
    const hostId = "host";
    const initialState: VotingRoom = {
      id: "room-1",
      phase: "voting",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [],
      votes: [],
    };

    const votes = [{ playerId: "p2", choiceIndex: 0, betPoints: 2 }];
    const event: VoteListUpdated = {
      type: "VoteListUpdated",
      payload: { roomId: "room-1", votes },
      occurredAt: new Date(),
      version: 6,
    };

    // Act
    const newState = evolve(initialState, event) as VotingRoom;

    // Assert
    expect(newState.votes).toEqual(votes);
  });

  it("RoundResultAnnouncedでround_resultフェーズに遷移する", () => {
    // Arrange
    const initialState: VotingRoom = {
      id: "room-1",
      phase: "voting",
      hostId: "host",
      players: [],
      round: 1,
      parentPlayerId: "host",
      theme: "お題",
      meanings: [],
      votes: [],
    };

    const event: RoundResultAnnounced = {
      type: "RoundResultAnnounced",
      payload: { roomId: "room-1" },
      occurredAt: new Date(),
      version: 7,
    };

    // Act
    const newState = evolve(initialState, event) as RoundResultRoom;

    // Assert
    expect(newState.phase).toBe("round_result");
  });

  describe("ScoreUpdated", () => {
    it("子が正解した場合、子に加点され親から減点される", () => {
      // Arrange
      const hostId = "host";
      const playerId = "p2";
      const initialState: RoundResultRoom = {
        id: "room-1",
        phase: "round_result",
        hostId,
        players: [
          { id: hostId, name: "Host", score: 10 },
          { id: playerId, name: "P2", score: 10 },
        ],
        round: 1,
        parentPlayerId: hostId,
        theme: "お題",
        meanings: [],
        votes: [],
      };

      const event: ScoreUpdated = {
        type: "ScoreUpdated",
        payload: {
          roomId: "room-1",
          playerId,
          betPoints: 3,
          isChoosingCorrectMeaning: true,
          meaningSubmittedPlayerId: hostId,
          parentPlayerId: hostId,
        },
        occurredAt: new Date(),
        version: 8,
      };

      // Act
      const newState = evolve(initialState, event);

      // Assert
      expect(newState.players).toContainEqual(expect.objectContaining({ id: hostId, score: 7 })); // 10 - 3
      expect(newState.players).toContainEqual(expect.objectContaining({ id: playerId, score: 13 })); // 10 + 3
    });

    it("子が不正解の場合、子から減点され、偽の意味の作者と親に加点される", () => {
      // Arrange
      const hostId = "host";
      const votingPlayerId = "p2";
      const authorPlayerId = "p3";
      const initialState: RoundResultRoom = {
        id: "room-1",
        phase: "round_result",
        hostId,
        players: [
          { id: hostId, name: "Host", score: 10 },
          { id: votingPlayerId, name: "P2", score: 10 },
          { id: authorPlayerId, name: "P3", score: 10 },
        ],
        round: 1,
        parentPlayerId: hostId,
        theme: "お題",
        meanings: [],
        votes: [],
      };

      const event: ScoreUpdated = {
        type: "ScoreUpdated",
        payload: {
          roomId: "room-1",
          playerId: votingPlayerId,
          betPoints: 2,
          isChoosingCorrectMeaning: false,
          meaningSubmittedPlayerId: authorPlayerId,
          parentPlayerId: hostId,
        },
        occurredAt: new Date(),
        version: 8,
      };

      // Act
      const newState = evolve(initialState, event);

      // Assert
      expect(newState.players).toContainEqual(
        expect.objectContaining({ id: votingPlayerId, score: 7 }),
      ); // 10 - (2 + 1)
      expect(newState.players).toContainEqual(
        expect.objectContaining({ id: authorPlayerId, score: 12 }),
      ); // 10 + 2
      expect(newState.players).toContainEqual(expect.objectContaining({ id: hostId, score: 11 })); // 10 + 1
    });
  });

  it("AllChildrenMissedで親にボーナスが加算される", () => {
    // Arrange
    const hostId = "host";
    const initialState: RoundResultRoom = {
      id: "room-1",
      phase: "round_result",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [],
      votes: [],
    };

    const event: AllChildrenMissed = {
      type: "AllChildrenMissed",
      payload: {
        roomId: "room-1",
        parentPlayerId: hostId,
        gainedPoints: 2,
      },
      occurredAt: new Date(),
      version: 10,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.players).toContainEqual(expect.objectContaining({ id: hostId, score: 14 })); // 10 + (2 * 2人)
    expect(newState.players).toContainEqual(expect.objectContaining({ id: "p2", score: 8 })); // 10 - 2
    expect(newState.players).toContainEqual(expect.objectContaining({ id: "p3", score: 8 })); // 10 - 2
  });

  it("NextRoundStartedで次のラウンドへ遷移し、親が交代する", () => {
    // Arrange
    const initialState: RoundResultRoom = {
      id: "room-1",
      phase: "round_result",
      hostId: "host",
      players: [
        { id: "host", name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
      ],
      round: 1,
      parentPlayerId: "host",
      theme: "お題",
      meanings: [],
      votes: [],
    };

    const event: NextRoundStarted = {
      type: "NextRoundStarted",
      payload: {
        roomId: "room-1",
        nextRound: 2,
        nextParentId: "p2",
      },
      occurredAt: new Date(),
      version: 11,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.phase).toBe("theme_input");
    const nextRoom = newState as ThemeInputRoom;
    expect(nextRoom.round).toBe(2);
    expect(nextRoom.parentPlayerId).toBe("p2");
    expect(nextRoom.players).toEqual(initialState.players);
  });

  it("GameEndedで最終結果フェーズへ遷移する", () => {
    // Arrange
    const initialState: RoundResultRoom = {
      id: "room-1",
      phase: "round_result",
      hostId: "host",
      players: [{ id: "host", name: "Host", score: 10 }],
      round: 1,
      parentPlayerId: "host",
      theme: "お題",
      meanings: [],
      votes: [],
    };

    const event: GameEnded = {
      type: "GameEnded",
      payload: { roomId: "room-1" },
      occurredAt: new Date(),
      version: 12,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.phase).toBe("final_result");
    expect(newState.players).toEqual(initialState.players);
  });
});
