import { describe, expect, it } from "vitest";
import type { MeaningInputRoom, ThemeInputRoom, VotingRoom, WaitingForJoinRoom } from "./Room";
import {
  decideCreateRoom,
  decideInputMeaning,
  decideInputTheme,
  decideJoinRoom,
  decideStartGame,
  decideVote,
} from "./RoomDecider";
import type {
  AllChildrenMissed,
  GameStarted,
  MeaningListUpdated,
  PlayerJoined,
  RoomCreated,
  ScoreUpdated,
  ThemeInputted,
  VoteListUpdated,
  VotingStarted,
} from "./RoomEvents";

describe("decideCreateRoom", () => {
  it("RoomCreatedイベントを返す", () => {
    const roomId = "room-1";
    const hostId = "host-1";
    const result = decideCreateRoom(roomId, hostId, "TestPlayer");

    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as RoomCreated;
    expect(event.type).toBe("RoomCreated");
    expect(event.payload.hostName).toBe("TestPlayer");
    expect(event.payload.roomId).toBe(roomId);
    expect(event.payload.hostId).toBe(hostId);
  });

  it("プレイヤー名が空の場合、エラーを返す", () => {
    const result = decideCreateRoom("room-1", "host-1", "");

    expect(result.success).toBe(false);
  });
});

describe("decideJoinRoom", () => {
  it("参加待機状態のルームに参加できる", () => {
    // Arrange
    const room: WaitingForJoinRoom = {
      id: "room-1",
      phase: "waiting_for_join",
      players: [{ id: "host", name: "Host", score: 0 }],
      hostId: "host",
    };

    // Act
    const playerId = "joiner-1";
    const result = decideJoinRoom(room, playerId, "Joiner", 1);

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as PlayerJoined;
    expect(event.type).toBe("PlayerJoined");
    expect(event.payload.playerName).toBe("Joiner");
    expect(event.payload.roomId).toBe(room.id);
    expect(event.payload.playerId).toBe(playerId);
  });

  it("参加待機状態でないルームには参加できない", () => {
    // Arrange
    const room = {
      id: "room-1",
      phase: "playing", // Invalid phase for join
      round: 1,
      players: [],
      hostId: "host",
    } as unknown as WaitingForJoinRoom;

    // Act
    const result = decideJoinRoom(room, "joiner-1", "Joiner", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("満員のルームには参加できない", () => {
    // Arrange
    const players = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      score: 0,
    }));
    const room: WaitingForJoinRoom = {
      id: "room-1",
      phase: "waiting_for_join",
      players: players,
      hostId: "p0",
    };

    // Act
    const result = decideJoinRoom(room, "joiner-1", "Joiner", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("名前が空の場合は参加できない", () => {
    const room: WaitingForJoinRoom = {
      id: "room-1",
      phase: "waiting_for_join",
      players: [{ id: "host", name: "Host", score: 0 }],
      hostId: "host",
    };

    const result = decideJoinRoom(room, "joiner-1", "", 1);

    expect(result.success).toBe(false);
  });
});

describe("decideStartGame", () => {
  it("ホストがゲームを開始できる", () => {
    // Arrange
    const hostId = "host";
    const room: WaitingForJoinRoom = {
      id: "room-1",
      phase: "waiting_for_join",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
    };

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
    const hostId = "host";
    const otherPlayerId = "p2";
    const room: WaitingForJoinRoom = {
      id: "room-1",
      phase: "waiting_for_join",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: otherPlayerId, name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
    };

    // Act
    const result = decideStartGame(room, otherPlayerId, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("3人未満ではゲームを開始できない", () => {
    // Arrange
    const hostId = "host";
    const room: WaitingForJoinRoom = {
      id: "room-1",
      phase: "waiting_for_join",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
      ],
    };

    // Act
    const result = decideStartGame(room, hostId, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("待機フェーズ以外ではゲームを開始できない", () => {
    // Arrange
    const hostId = "host";
    const room = {
      id: "room-1",
      phase: "theme_input", // Already started
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      hostId,
      round: 1, // Added satisfying type constraints loosely
    } as unknown as WaitingForJoinRoom; // Force type for test

    // Act
    const result = decideStartGame(room, hostId, 1);

    expect(result.success).toBe(false);
  });
});

describe("decideInputTheme", () => {
  it("親がお題を入力できる", () => {
    // Arrange
    const hostId = "host";
    const room: ThemeInputRoom = {
      id: "room-1",
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

    // Act
    const theme = "お題";
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
    const hostId = "host";
    const otherPlayerId = "p2";
    const room: ThemeInputRoom = {
      id: "room-1",
      phase: "theme_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: otherPlayerId, name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
    };

    // Act
    const result = decideInputTheme(room, otherPlayerId, "お題", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("お題入力フェーズ以外ではお題を入力できない", () => {
    // Arrange
    const hostId = "host";
    const room = {
      id: "room-1",
      phase: "waiting_for_join",
      hostId,
      players: [{ id: hostId, name: "Host", score: 10 }],
    } as unknown as ThemeInputRoom;

    // Act
    const result = decideInputTheme(room, hostId, "お題", 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("お題が空の場合は入力できない", () => {
    // Arrange
    const hostId = "host";
    const room: ThemeInputRoom = {
      id: "room-1",
      phase: "theme_input",
      hostId,
      players: [{ id: hostId, name: "Host", score: 10 }],
      round: 1,
      parentPlayerId: hostId,
    };

    // Act
    const result = decideInputTheme(room, hostId, "", 1);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideInputMeaning", () => {
  it("全員の意味が揃うまではMeaningListUpdatedのみ発行される", () => {
    // Arrange
    const hostId = "host";
    const inputtingPlayerId = "p2";
    const room: MeaningInputRoom = {
      id: "room-1",
      phase: "meaning_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [], // No meanings yet
    };

    // Act
    const newMeaning = "新しい意味";
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
    const hostId = "host";
    const inputtingPlayerId = "p3";
    const existingMeaning1 = { playerId: "p2", text: "既存の意味" };
    const existingMeaning2 = { playerId: hostId, text: "ホストの意味" };
    const room: MeaningInputRoom = {
      id: "room-1",
      phase: "meaning_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: inputtingPlayerId, name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [existingMeaning1, existingMeaning2],
    };

    // Act
    const newMeaning = "新しい意味";
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
        expect.objectContaining({ playerId: "p2", text: "既存の意味" }),
        expect.objectContaining({ playerId: hostId, text: "ホストの意味" }),
        expect.objectContaining({ playerId: inputtingPlayerId, text: newMeaning }),
      ]),
    );
    // Check choiceIndices are 0, 1, 2
    const indices = votingStarted.payload.meanings.map((m) => m.choiceIndex).sort();
    expect(indices).toEqual([0, 1, 2]);
  });

  it("すでに意味を入力済みの場合はエラー", () => {
    // Arrange
    const hostId = "host";
    const room: MeaningInputRoom = {
      id: "room-1",
      phase: "meaning_input",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [{ playerId: hostId, text: "既に入力済み" }],
    };

    // Act
    const result = decideInputMeaning(room, hostId, "新しい意味", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("ルームに参加していないプレイヤーは入力できない", () => {
    // Arrange
    const hostId = "host";
    const room: MeaningInputRoom = {
      id: "room-1",
      phase: "meaning_input",
      hostId,
      players: [{ id: hostId, name: "Host", score: 10 }],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [],
    };

    // Act
    const result = decideInputMeaning(room, "unknown", "意味", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("意味が空の場合は入力できない", () => {
    // Arrange
    const hostId = "host";
    const room: MeaningInputRoom = {
      id: "room-1",
      phase: "meaning_input",
      hostId,
      players: [{ id: hostId, name: "Host", score: 10 }],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [],
    };

    // Act
    const result = decideInputMeaning(room, hostId, "", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });

  it("意味入力フェーズ以外では意味を入力できない", () => {
    // Arrange
    const hostId = "host";
    const room = {
      id: "room-1",
      phase: "theme_input",
      hostId,
      players: [{ id: hostId, name: "Host", score: 10 }],
    } as unknown as MeaningInputRoom;

    // Act
    const result = decideInputMeaning(room, hostId, "意味", 1, 1);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("decideVote", () => {
  it("子全員が投票していない場合、VoteListUpdatedのみ発行される", () => {
    // Arrange
    const hostId = "host";
    const votingPlayerId = "p2";
    const room: VotingRoom = {
      id: "room-1",
      phase: "voting",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [
        { playerId: hostId, text: "本当の意味", choiceIndex: 0 },
        { playerId: "p2", text: "P2の偽意味", choiceIndex: 1 },
        { playerId: "p3", text: "P3の偽意味", choiceIndex: 2 },
      ],
      votes: [],
    };

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
    const hostId = "host";
    const lastVotingPlayerId = "p3";
    const room: VotingRoom = {
      id: "room-1",
      phase: "voting",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: lastVotingPlayerId, name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [
        { playerId: hostId, text: "本当の意味", choiceIndex: 0 },
        { playerId: "p2", text: "P2の偽意味", choiceIndex: 1 },
        { playerId: lastVotingPlayerId, text: "P3の偽意味", choiceIndex: 2 },
      ],
      votes: [
        { playerId: "p2", choiceIndex: 0, betPoints: 2 }, // P2正解
      ],
    };

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

    // P2正解のスコア計算
    const p2Score = scoreEvents.find((e) => e.payload.playerId === "p2");
    expect(p2Score?.payload).toEqual(
      expect.objectContaining({
        betPoints: 2,
        isChoosingCorrectMeaning: true,
        meaningSubmittedPlayerId: hostId,
      }),
    );

    const p3Score = events[3] as ScoreUpdated;
    expect(p3Score.type).toBe("ScoreUpdated");
    expect(p3Score.payload).toEqual(
      expect.objectContaining({
        playerId: lastVotingPlayerId,
        betPoints: 3,
        isChoosingCorrectMeaning: false,
        meaningSubmittedPlayerId: "p2",
      }),
    );
  });

  it("全員不正解の場合、AllChildrenMissedが発行される", () => {
    // Arrange
    const hostId = "host";
    const lastVotingPlayerId = "p3";
    const room: VotingRoom = {
      id: "room-1",
      phase: "voting",
      hostId,
      players: [
        { id: hostId, name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: lastVotingPlayerId, name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: hostId,
      theme: "お題",
      meanings: [
        { playerId: hostId, text: "本当の意味", choiceIndex: 0 },
        { playerId: "p2", text: "P2の偽意味", choiceIndex: 1 },
        { playerId: lastVotingPlayerId, text: "P3の偽意味", choiceIndex: 2 },
      ],
      votes: [
        { playerId: "p2", choiceIndex: 2, betPoints: 1 }, // P2不正解
      ],
    };

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
    const defaultRoom: VotingRoom = {
      id: "room-1",
      phase: "voting",
      hostId: "host",
      players: [
        { id: "host", name: "Host", score: 10 },
        { id: "p2", name: "P2", score: 10 },
        { id: "p3", name: "P3", score: 10 },
      ],
      round: 1,
      parentPlayerId: "host",
      theme: "お題",
      meanings: [
        { playerId: "host", text: "正解", choiceIndex: 0 },
        { playerId: "p2", text: "偽1", choiceIndex: 1 },
        { playerId: "p3", text: "偽2", choiceIndex: 2 },
      ],
      votes: [],
    };

    it("投票フェーズ以外では投票できない", () => {
      const room = { ...defaultRoom, phase: "meaning_input" } as unknown as VotingRoom;
      const result = decideVote(room, "p2", 0, 1, 1);
      expect(result.success).toBe(false);
    });

    it("親は投票できない", () => {
      const result = decideVote(defaultRoom, "host", 1, 1, 1);
      expect(result.success).toBe(false);
    });

    it("重複投票はできない", () => {
      const room: VotingRoom = {
        ...defaultRoom,
        votes: [{ playerId: "p2", choiceIndex: 0, betPoints: 1 }],
      };
      const result = decideVote(room, "p2", 2, 1, 1);
      expect(result.success).toBe(false);
    });

    it("自作の意味には投票できない", () => {
      const result = decideVote(defaultRoom, "p2", 1, 1, 1);
      expect(result.success).toBe(false);
    });

    it("存在しない選択肢には投票できない", () => {
      const result = decideVote(defaultRoom, "p2", 99, 1, 1);
      expect(result.success).toBe(false);
    });

    it.each([0, 4])("賭け点が範囲外(%i)の場合は投票できない", (betPoints) => {
      expect(decideVote(defaultRoom, "p2", 0, betPoints, 1).success).toBe(false);
    });
  });
});
