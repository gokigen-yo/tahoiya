import { describe, expect, it } from "vitest";
import type { MeaningInputRoom, ThemeInputRoom, WaitingForJoinRoom } from "./Room";
import {
  decideCreateRoom,
  decideInputMeaning,
  decideInputTheme,
  decideJoinRoom,
  decideStartGame,
} from "./RoomDecider";
import type {
  GameStarted,
  MeaningInputted,
  PlayerJoined,
  RoomCreated,
  ThemeInputted,
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
  it("プレイヤーが意味を入力できる", () => {
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
      meanings: [],
    };

    // Act
    const meaning = "意味";
    const result = decideInputMeaning(room, hostId, meaning, 1);

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as MeaningInputted;
    expect(event.type).toBe("MeaningInputted");
    expect(event.payload.roomId).toBe(room.id);
    expect(event.payload.playerId).toBe(hostId);
    expect(event.payload.theme).toBe("お題");
    expect(event.payload.meaning).toBe(meaning);
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
    const result = decideInputMeaning(room, hostId, "新しい意味", 1);

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
    const result = decideInputMeaning(room, "unknown", "意味", 1);

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
    const result = decideInputMeaning(room, hostId, "", 1);

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
    const result = decideInputMeaning(room, hostId, "意味", 1);

    // Assert
    expect(result.success).toBe(false);
  });
});
