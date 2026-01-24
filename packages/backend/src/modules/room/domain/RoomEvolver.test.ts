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

// Factory functions for test data
const createWaitingRoom = (overrides: Partial<WaitingForJoinRoom> = {}): WaitingForJoinRoom => ({
  id: "room-1",
  phase: "waiting_for_join",
  players: [{ id: "player_id_1", name: "プレイヤー1", score: 10 }],
  hostId: "player_id_1",
  ...overrides,
});

const createThemeInputRoom = (overrides: Partial<ThemeInputRoom> = {}): ThemeInputRoom => ({
  id: "room-1",
  phase: "theme_input",
  players: [
    { id: "player_id_1", name: "プレイヤー1", score: 10 },
    { id: "player_id_2", name: "プレイヤー2", score: 10 },
    { id: "player_id_3", name: "プレイヤー3", score: 10 },
  ],
  hostId: "player_id_1",
  round: 1,
  parentPlayerId: "player_id_1",
  ...overrides,
});

const createMeaningInputRoom = (overrides: Partial<MeaningInputRoom> = {}): MeaningInputRoom => ({
  id: "room-1",
  phase: "meaning_input",
  players: [
    { id: "player_id_1", name: "プレイヤー1", score: 10 },
    { id: "player_id_2", name: "プレイヤー2", score: 10 },
    { id: "player_id_3", name: "プレイヤー3", score: 10 },
  ],
  hostId: "player_id_1",
  round: 1,
  parentPlayerId: "player_id_1",
  theme: "お題",
  meanings: [],
  ...overrides,
});

const createVotingRoom = (overrides: Partial<VotingRoom> = {}): VotingRoom => ({
  id: "room-1",
  phase: "voting",
  players: [
    { id: "player_id_1", name: "プレイヤー1", score: 10 },
    { id: "player_id_2", name: "プレイヤー2", score: 10 },
    { id: "player_id_3", name: "プレイヤー3", score: 10 },
  ],
  hostId: "player_id_1",
  round: 1,
  parentPlayerId: "player_id_1",
  theme: "お題",
  meanings: [],
  votes: [],
  ...overrides,
});

const createRoundResultRoom = (overrides: Partial<RoundResultRoom> = {}): RoundResultRoom => ({
  id: "room-1",
  phase: "round_result",
  players: [
    { id: "player_id_1", name: "プレイヤー1", score: 10 },
    { id: "player_id_2", name: "プレイヤー2", score: 10 },
    { id: "player_id_3", name: "プレイヤー3", score: 10 },
  ],
  hostId: "player_id_1",
  round: 1,
  parentPlayerId: "player_id_1",
  theme: "お題",
  meanings: [],
  votes: [],
  ...overrides,
});

describe("evolve", () => {
  it("RoomCreatedイベントによって新しくWaitingForJoinRoomが作成される", () => {
    // Arrange
    const roomId = "room-1";
    const hostId = "player_id_1";
    const event: RoomCreated = {
      type: "RoomCreated",
      payload: {
        roomId,
        hostId,
        hostName: "プレイヤー1",
      },
      occurredAt: new Date(),
      version: 1,
    };

    // Act
    const newState = evolve(null, event) as WaitingForJoinRoom;

    // Assert
    expect(newState).toBeDefined();
    expect(newState.id).toBe(roomId);
    expect(newState.phase).toBe("waiting_for_join");
    expect(newState.hostId).toBe(hostId);
    expect(newState.players).toHaveLength(1);
    expect(newState.players[0].id).toBe(hostId);
    expect(newState.players[0].name).toBe("プレイヤー1");
    expect(newState.players[0].score).toBe(10);
  });

  it("PlayerJoinedイベントによってプレイヤーがルームに追加される", () => {
    // Arrange
    const initialState = createWaitingRoom();

    const newPlayerId = "player_id_2";
    const event: PlayerJoined = {
      type: "PlayerJoined",
      payload: {
        roomId: initialState.id,
        playerId: newPlayerId,
        playerName: "プレイヤー2",
      },
      occurredAt: new Date(),
      version: 2,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.players).toHaveLength(2);
    expect(newState.players[1].id).toBe(newPlayerId);
    expect(newState.players[1].name).toBe("プレイヤー2");
    expect(newState.players[1].score).toBe(10);
  });

  it("GameStartedイベントによってゲームが開始され、お題入力フェーズに遷移する", () => {
    // Arrange
    const hostId = "player_id_1";
    const initialState = createWaitingRoom({
      hostId,
      players: [
        { id: hostId, name: "プレイヤー1", score: 10 },
        { id: "player_id_2", name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
    });

    const event: GameStarted = {
      type: "GameStarted",
      payload: {
        roomId: initialState.id,
        playerId: hostId,
      },
      occurredAt: new Date(),
      version: 2,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    expect(newState.phase).toBe("theme_input");
    const themeInputRoom = newState as ThemeInputRoom;
    expect(themeInputRoom.round).toBe(1);
    expect(themeInputRoom.parentPlayerId).toBe(hostId);
  });

  it("ThemeInputtedイベントによってお題が設定され、意味入力フェーズに遷移する", () => {
    // Arrange
    const hostId = "player_id_1";
    const initialState = createThemeInputRoom({
      hostId,
      parentPlayerId: hostId,
    });

    const theme = "お題";
    const event: ThemeInputted = {
      type: "ThemeInputted",
      payload: {
        roomId: initialState.id,
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
    const meaningInputRoom = newState as MeaningInputRoom;
    expect(meaningInputRoom.theme).toBe(theme);
    expect(meaningInputRoom.meanings).toEqual([]);
  });

  it("MeaningListUpdatedイベントによってルームに意味が追加される", () => {
    // Arrange
    const playerId = "player_id_2";
    const initialState = createMeaningInputRoom({
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 10 },
        { id: playerId, name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
      meanings: [],
    });

    const event: MeaningListUpdated = {
      type: "MeaningListUpdated",
      payload: {
        roomId: initialState.id,
        meanings: [{ playerId, text: "意味" }],
      },
      occurredAt: new Date(),
      version: 4,
    };

    // Act
    const newState = evolve(initialState, event);

    // Assert
    const meaningInputRoom = newState as MeaningInputRoom;
    expect(meaningInputRoom.meanings).toHaveLength(1);
    expect(meaningInputRoom.meanings[0].playerId).toBe(playerId);
    expect(meaningInputRoom.meanings[0].text).toBe("意味");
  });

  it("VotingStartedイベントによって投票フェーズに遷移し、選択肢が設定される", () => {
    // Arrange
    const hostId = "player_id_1";
    const initialState = createMeaningInputRoom({
      hostId,
      players: [
        { id: hostId, name: "プレイヤー1", score: 10 },
        { id: "player_id_2", name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
      meanings: [
        { playerId: hostId, text: "意味1" },
        { playerId: "player_id_2", text: "意味2" },
        { playerId: "player_id_3", text: "意味3" },
      ],
    });

    const event: VotingStarted = {
      type: "VotingStarted",
      payload: {
        roomId: initialState.id,
        meanings: [
          { playerId: hostId, text: "意味1", choiceIndex: 0 },
          { playerId: "player_id_2", text: "意味2", choiceIndex: 1 },
          { playerId: "player_id_3", text: "意味3", choiceIndex: 2 },
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
    expect(votingRoom.meanings).toHaveLength(3);
    expect(votingRoom.meanings[0].choiceIndex).toBe(0);
    expect(votingRoom.meanings[1].choiceIndex).toBe(1);
    expect(votingRoom.meanings[2].choiceIndex).toBe(2);
    expect(votingRoom.votes).toEqual([]);
  });

  it("VoteListUpdatedイベントによって投票リストが更新される", () => {
    // Arrange
    const initialState = createVotingRoom({
      votes: [],
    });

    const votes = [{ playerId: "player_id_2", choiceIndex: 0, betPoints: 2 }];
    const event: VoteListUpdated = {
      type: "VoteListUpdated",
      payload: { roomId: initialState.id, votes },
      occurredAt: new Date(),
      version: 6,
    };

    // Act
    const newState = evolve(initialState, event) as VotingRoom;

    // Assert
    expect(newState.votes).toEqual(votes);
  });

  it("RoundResultAnnouncedイベントによってラウンド結果フェーズに遷移する", () => {
    // Arrange
    const initialState = createVotingRoom();

    const event: RoundResultAnnounced = {
      type: "RoundResultAnnounced",
      payload: { roomId: initialState.id },
      occurredAt: new Date(),
      version: 7,
    };

    // Act
    const newState = evolve(initialState, event) as RoundResultRoom;

    // Assert
    expect(newState.phase).toBe("round_result");
  });

  describe("ScoreUpdatedイベントの処理", () => {
    it("子が正解した場合、子に加点され親から減点される", () => {
      // Arrange
      const hostId = "player_id_1";
      const playerId = "player_id_2";
      const initialState = createRoundResultRoom({
        hostId,
        players: [
          { id: hostId, name: "プレイヤー1", score: 10 },
          { id: playerId, name: "プレイヤー2", score: 10 },
          { id: "player_id_3", name: "プレイヤー3", score: 10 },
        ],
        parentPlayerId: hostId,
      });

      const event: ScoreUpdated = {
        type: "ScoreUpdated",
        payload: {
          roomId: initialState.id,
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
      const hostId = "player_id_1";
      const votingPlayerId = "player_id_2";
      const authorPlayerId = "player_id_3";
      const initialState = createRoundResultRoom({
        hostId,
        players: [
          { id: hostId, name: "プレイヤー1", score: 10 },
          { id: votingPlayerId, name: "プレイヤー2", score: 10 },
          { id: authorPlayerId, name: "プレイヤー3", score: 10 },
        ],
        parentPlayerId: hostId,
      });

      const event: ScoreUpdated = {
        type: "ScoreUpdated",
        payload: {
          roomId: initialState.id,
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

  it("AllChildrenMissedイベントによって親にボーナスが加算され、子から減点される", () => {
    // Arrange
    const hostId = "player_id_1";
    const initialState = createRoundResultRoom({
      hostId,
      players: [
        { id: hostId, name: "プレイヤー1", score: 10 },
        { id: "player_id_2", name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
      parentPlayerId: hostId,
    });

    const event: AllChildrenMissed = {
      type: "AllChildrenMissed",
      payload: {
        roomId: initialState.id,
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
    expect(newState.players).toContainEqual(
      expect.objectContaining({ id: "player_id_2", score: 8 }),
    ); // 10 - 2
    expect(newState.players).toContainEqual(
      expect.objectContaining({ id: "player_id_3", score: 8 }),
    ); // 10 - 2
  });

  it("NextRoundStartedイベントによって次のラウンドへ遷移し、親が交代する", () => {
    // Arrange
    const initialState = createRoundResultRoom({
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 10 },
        { id: "player_id_2", name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
      round: 1,
      parentPlayerId: "player_id_1",
    });

    const event: NextRoundStarted = {
      type: "NextRoundStarted",
      payload: {
        roomId: initialState.id,
        nextRound: 2,
        nextParentId: "player_id_2",
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
    expect(nextRoom.parentPlayerId).toBe("player_id_2");
    expect(nextRoom.players).toEqual(initialState.players);
  });

  it("GameEndedイベントによって最終結果フェーズへ遷移する", () => {
    // Arrange
    const initialState = createRoundResultRoom();

    const event: GameEnded = {
      type: "GameEnded",
      payload: { roomId: initialState.id },
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
