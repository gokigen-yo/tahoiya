import { describe, expect, it } from "vitest";
import type {
  MeaningInputRoom,
  RoundResultRoom,
  ThemeInputRoom,
  VotingRoom,
  WaitingForJoinRoom,
} from "./Room";
import {
  decideCreateRoom,
  decideInputMeaning,
  decideInputTheme,
  decideJoinRoom,
  decideNextRound,
  decideStartGame,
  decideVote,
} from "./RoomDecider";
import type {
  AllChildrenMissed,
  GameEnded,
  GameStarted,
  MeaningListUpdated,
  NextRoundStarted,
  PlayerJoined,
  RoomCreated,
  ScoreUpdated,
  ThemeInputted,
  VoteListUpdated,
  VotingStarted,
} from "./RoomEvents";

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
  meanings: [
    { playerId: "player_id_1", text: "本当の意味", choiceIndex: 0 },
    { playerId: "player_id_2", text: "プレイヤー2の偽意味", choiceIndex: 1 },
    { playerId: "player_id_3", text: "プレイヤー3の偽意味", choiceIndex: 2 },
  ],
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

describe("decideCreateRoom", () => {
  it("プレイヤー名が正しい場合、RoomCreatedイベントを返す", () => {
    // Arrange
    const roomId = "room-1";
    const hostId = "player_id_1";

    // Act
    const result = decideCreateRoom(roomId, hostId, "プレイヤー1");

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as RoomCreated;
    expect(event.type).toBe("RoomCreated");
    expect(event.payload.hostName).toBe("プレイヤー1");
    expect(event.payload.roomId).toBe(roomId);
    expect(event.payload.hostId).toBe(hostId);
  });

  it("プレイヤー名が空の場合、エラーを返す", () => {
    // Act
    const result = decideCreateRoom("room-1", "player_id_1", "");

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideJoinRoom", () => {
  it("参加待機状態のルームに新しいプレイヤーが参加できる", () => {
    // Arrange
    const room = createWaitingRoom();
    const playerId = "player_id_2";

    // Act
    const result = decideJoinRoom(room, playerId, "プレイヤー2", 1);

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as PlayerJoined;
    expect(event.type).toBe("PlayerJoined");
    expect(event.payload.playerName).toBe("プレイヤー2");
    expect(event.payload.roomId).toBe(room.id);
    expect(event.payload.playerId).toBe(playerId);
  });

  it("参加待機状態でないルームには参加できない", () => {
    // Arrange
    const room = {
      ...createWaitingRoom(),
      phase: "playing" as any,
    } as unknown as WaitingForJoinRoom;

    // Act
    const result = decideJoinRoom(room, "player_id_2", "プレイヤー2", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("満員のルームには参加できない", () => {
    // Arrange
    const players = Array.from({ length: 8 }, (_, i) => ({
      id: `player_id_${i + 1}`,
      name: `プレイヤー${i + 1}`,
      score: 10,
    }));
    const room = createWaitingRoom({ players });

    // Act
    const result = decideJoinRoom(room, "player_id_9", "プレイヤー9", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("名前が空の場合は参加できない", () => {
    // Arrange
    const room = createWaitingRoom();

    // Act
    const result = decideJoinRoom(room, "player_id_2", "", 1);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideStartGame", () => {
  it("ホストが3人以上のプレイヤーがいる状態でゲームを開始できる", () => {
    // Arrange
    const hostId = "player_id_1";
    const room = createWaitingRoom({
      hostId,
      players: [
        { id: hostId, name: "プレイヤー1", score: 10 },
        { id: "player_id_2", name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
    });

    // Act
    const result = decideStartGame(room, hostId, 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as GameStarted;
    expect(event.type).toBe("GameStarted");
    expect(event.payload.roomId).toBe(room.id);
    expect(event.payload.playerId).toBe(hostId);
  });

  it("ホスト以外はゲームを開始できない", () => {
    // Arrange
    const hostId = "player_id_1";
    const otherPlayerId = "player_id_2";
    const room = createWaitingRoom({
      hostId,
      players: [
        { id: hostId, name: "プレイヤー1", score: 10 },
        { id: otherPlayerId, name: "プレイヤー2", score: 10 },
        { id: "player_id_3", name: "プレイヤー3", score: 10 },
      ],
    });

    // Act
    const result = decideStartGame(room, otherPlayerId, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("3人未満ではゲームを開始できない", () => {
    // Arrange
    const hostId = "player_id_1";
    const room = createWaitingRoom({
      hostId,
      players: [
        { id: hostId, name: "プレイヤー1", score: 10 },
        { id: "player_id_2", name: "プレイヤー2", score: 10 },
      ],
    });

    // Act
    const result = decideStartGame(room, hostId, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("待機フェーズ以外ではゲームを開始できない", () => {
    // Arrange
    const room = {
      ...createWaitingRoom({
        players: [
          { id: "player_id_1", name: "プレイヤー1", score: 10 },
          { id: "player_id_2", name: "プレイヤー2", score: 10 },
          { id: "player_id_3", name: "プレイヤー3", score: 10 },
        ],
      }),
      phase: "theme_input" as any,
    } as unknown as WaitingForJoinRoom;

    // Act
    const result = decideStartGame(room, "player_id_1", 1);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideInputTheme", () => {
  it("親が有効なお題を入力できる", () => {
    // Arrange
    const hostId = "player_id_1";
    const room = createThemeInputRoom({ parentPlayerId: hostId });
    const theme = "お題";

    // Act
    const result = decideInputTheme(room, hostId, theme, 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as ThemeInputted;
    expect(event.type).toBe("ThemeInputted");
    expect(event.payload.roomId).toBe(room.id);
    expect(event.payload.playerId).toBe(hostId);
    expect(event.payload.theme).toBe(theme);
  });

  it("親以外はお題を入力できない", () => {
    // Arrange
    const room = createThemeInputRoom({ parentPlayerId: "player_id_1" });

    // Act
    const result = decideInputTheme(room, "player_id_2", "お題", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("お題入力フェーズ以外ではお題を入力できない", () => {
    // Arrange
    const room = {
      ...createThemeInputRoom(),
      phase: "waiting_for_join" as any,
    } as unknown as ThemeInputRoom;

    // Act
    const result = decideInputTheme(room, "player_id_1", "お題", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("お題が空の場合は入力できない", () => {
    // Arrange
    const room = createThemeInputRoom();

    // Act
    const result = decideInputTheme(room, "player_id_1", "", 1);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideInputMeaning", () => {
  it("全員の意味が揃うまではMeaningListUpdatedのみ発行される", () => {
    // Arrange
    const room = createMeaningInputRoom();
    const inputtingPlayerId = "player_id_2";
    const newMeaning = "新しい意味";

    // Act
    const result = decideInputMeaning(room, inputtingPlayerId, newMeaning, 1, 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;

    // Check for only 1 event: MeaningListUpdated
    expect(successResult.value).toHaveLength(1);

    const meaningListUpdated = successResult.value[0] as MeaningListUpdated;
    expect(meaningListUpdated.type).toBe("MeaningListUpdated");
    expect(meaningListUpdated.payload.roomId).toBe(room.id);
    expect(meaningListUpdated.payload.meanings).toHaveLength(1);
    expect(meaningListUpdated.payload.meanings).toEqual([
      { playerId: inputtingPlayerId, text: newMeaning },
    ]);
  });

  it("全員の意味が揃うとMeaningListUpdatedとVotingStartedが発行される", () => {
    // Arrange
    const existingMeaning1 = { playerId: "player_id_2", text: "既存の意味" };
    const existingMeaning2 = { playerId: "player_id_1", text: "親の意味" };
    const room = createMeaningInputRoom({
      meanings: [existingMeaning1, existingMeaning2],
    });
    const inputtingPlayerId = "player_id_3";
    const newMeaning = "新しい意味";

    // Act
    // Using a fixed seed "1"
    const result = decideInputMeaning(room, inputtingPlayerId, newMeaning, 1, 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(2);

    const meaningListUpdated = successResult.value[0] as MeaningListUpdated;
    expect(meaningListUpdated.type).toBe("MeaningListUpdated");
    expect(meaningListUpdated.payload.roomId).toBe(room.id);
    expect(meaningListUpdated.payload.meanings).toEqual([
      existingMeaning1,
      existingMeaning2,
      { playerId: inputtingPlayerId, text: newMeaning },
    ]);

    const votingStarted = successResult.value[1] as VotingStarted;
    expect(votingStarted.type).toBe("VotingStarted");
    expect(votingStarted.payload.roomId).toBe(room.id);

    // Check elements are present (indices will be assigned by shuffle)
    expect(votingStarted.payload.meanings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ playerId: "player_id_2", text: "既存の意味" }),
        expect.objectContaining({ playerId: "player_id_1", text: "親の意味" }),
        expect.objectContaining({ playerId: inputtingPlayerId, text: newMeaning }),
      ]),
    );
    // Check choiceIndices are 0, 1, 2
    const indices = votingStarted.payload.meanings.map((m) => m.choiceIndex).sort();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("すでに意味を入力済みの場合はエラー", () => {
    // Arrange
    const room = createMeaningInputRoom({
      meanings: [{ playerId: "player_id_1", text: "既に入力済み" }],
    });

    // Act
    const result = decideInputMeaning(room, "player_id_1", "新しい意味", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("ルームに参加していないプレイヤーは入力できない", () => {
    // Arrange
    const room = createMeaningInputRoom();

    // Act
    const result = decideInputMeaning(room, "unknown", "意味", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("意味が空の場合は入力できない", () => {
    // Arrange
    const room = createMeaningInputRoom();

    // Act
    const result = decideInputMeaning(room, "player_id_1", "", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("意味入力フェーズ以外では意味を入力できない", () => {
    // Arrange
    const room = {
      ...createMeaningInputRoom(),
      phase: "theme_input" as any,
    } as unknown as MeaningInputRoom;

    // Act
    const result = decideInputMeaning(room, "player_id_1", "意味", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideVote", () => {
  it("子全員が投票していない場合、VoteListUpdatedのみ発行される", () => {
    // Arrange
    const room = createVotingRoom();
    const votingPlayerId = "player_id_2";

    // Act
    const result = decideVote(room, votingPlayerId, 0, 1, 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);

    const voteListUpdated = successResult.value[0] as VoteListUpdated;
    expect(voteListUpdated.type).toBe("VoteListUpdated");
    expect(voteListUpdated.payload.votes).toEqual([
      { playerId: votingPlayerId, choiceIndex: 0, betPoints: 1 },
    ]);
  });

  it("最後の一人が投票した際、スコア計算とラウンド終了のイベントが発行される", () => {
    // Arrange
    const lastVotingPlayerId = "player_id_3";
    const room = createVotingRoom({
      votes: [
        { playerId: "player_id_2", choiceIndex: 0, betPoints: 2 }, // プレイヤー2が正解
      ],
    });

    // Act
    const result = decideVote(room, lastVotingPlayerId, 1, 3, 2);

    // Assert
    expect(result.success).toBe(true);
    const events = (result as Extract<typeof result, { success: true }>).value;

    // VoteListUpdated, RoundResultAnnounced, ScoreUpdated x 2 (P2, P3)
    expect(events.length).toBeGreaterThanOrEqual(4);

    expect(events[0].type).toBe("VoteListUpdated");
    expect(events[1].type).toBe("RoundResultAnnounced");

    const scoreEvents = events.filter((e) => e.type === "ScoreUpdated") as ScoreUpdated[];
    expect(scoreEvents).toHaveLength(2);

    // プレイヤー2正解のスコア計算
    const p2Score = scoreEvents.find((e) => e.payload.playerId === "player_id_2");
    expect(p2Score?.payload).toEqual(
      expect.objectContaining({
        betPoints: 2,
        isChoosingCorrectMeaning: true,
        meaningSubmittedPlayerId: "player_id_1",
      }),
    );

    const p3Score = events[3] as ScoreUpdated;
    expect(p3Score.type).toBe("ScoreUpdated");
    expect(p3Score.payload).toEqual(
      expect.objectContaining({
        playerId: lastVotingPlayerId,
        betPoints: 3,
        isChoosingCorrectMeaning: false,
        meaningSubmittedPlayerId: "player_id_2",
      }),
    );
  });

  it("全員不正解の場合、AllChildrenMissedが発行される", () => {
    // Arrange
    const lastVotingPlayerId = "player_id_3";
    const room = createVotingRoom({
      votes: [
        { playerId: "player_id_2", choiceIndex: 2, betPoints: 1 }, // プレイヤー2が不正解（プレイヤー3の意味に投票）
      ],
    });

    // Act
    const result = decideVote(room, lastVotingPlayerId, 1, 1, 2);

    // Assert
    expect(result.success).toBe(true);
    const events = (result as Extract<typeof result, { success: true }>).value;

    expect(events.find((e) => e.type === "AllChildrenMissed")).toBeDefined();
    const allMissedEvent = events.find((e) => e.type === "AllChildrenMissed") as AllChildrenMissed;
    expect(allMissedEvent.payload.gainedPoints).toBe(1); // 1人1点
  });

  describe("バリデーション", () => {
    it("投票フェーズ以外では投票できない", () => {
      // Arrange
      const room = {
        ...createVotingRoom(),
        phase: "meaning_input" as any,
      } as unknown as VotingRoom;

      // Act
      const result = decideVote(room, "player_id_2", 0, 1, 1);

      // Assert
      expect(result.success).toBe(false);
    });

    it("親は投票できない", () => {
      // Arrange
      const room = createVotingRoom();

      // Act
      const result = decideVote(room, "player_id_1", 1, 1, 1);

      // Assert
      expect(result.success).toBe(false);
    });

    it("重複投票はできない", () => {
      // Arrange
      const room = createVotingRoom({
        votes: [{ playerId: "player_id_2", choiceIndex: 0, betPoints: 1 }],
      });

      // Act
      const result = decideVote(room, "player_id_2", 2, 1, 1);

      // Assert
      expect(result.success).toBe(false);
    });

    it("自作の意味には投票できない", () => {
      // Arrange
      const room = createVotingRoom();

      // Act
      const result = decideVote(room, "player_id_2", 1, 1, 1);

      // Assert
      expect(result.success).toBe(false);
    });

    it("存在しない選択肢には投票できない", () => {
      // Arrange
      const room = createVotingRoom();

      // Act
      const result = decideVote(room, "player_id_2", 99, 1, 1);

      // Assert
      expect(result.success).toBe(false);
    });

    it.each([0, 4])("賭け点が範囲外(%i)の場合は投票できない", (betPoints) => {
      // Arrange
      const room = createVotingRoom();

      // Act
      const result = decideVote(room, "player_id_2", 0, betPoints, 1);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe("decideNextRound", () => {
  it("ホストが実行した場合、NextRoundStartedが発行される", () => {
    // Arrange
    const room = createRoundResultRoom();

    // Act
    const result = decideNextRound(room, "player_id_1", 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    const event = successResult.value[0] as NextRoundStarted;
    expect(event.type).toBe("NextRoundStarted");
    expect(event.payload.nextRound).toBe(2);
    expect(event.payload.nextParentId).toBe("player_id_2");
  });

  it("最終ラウンドの場合、GameEndedが発行される", () => {
    // Arrange
    const room = createRoundResultRoom({
      round: 3,
      parentPlayerId: "player_id_3",
    });

    // Act
    const result = decideNextRound(room, "player_id_1", 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    const event = successResult.value[0] as GameEnded;
    expect(event.type).toBe("GameEnded");
  });

  it("ホスト以外は実行できない", () => {
    // Arrange
    const room = createRoundResultRoom();

    // Act
    const result = decideNextRound(room, "player_id_2", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("ラウンド結果フェーズ以外では実行できない", () => {
    // Arrange
    const room = {
      ...createRoundResultRoom(),
      phase: "voting" as any,
    } as unknown as RoundResultRoom;

    // Act
    const result = decideNextRound(room, "player_id_1", 1);

    // Assert
    expect(result.success).toBe(false);
  });
});
