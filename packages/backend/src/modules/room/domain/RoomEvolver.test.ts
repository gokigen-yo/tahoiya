import { describe, expect, it } from "vitest";
import type { MeaningInputRoom, ThemeInputRoom, WaitingForJoinRoom } from "./Room";
import type {
  GameStarted,
  MeaningInputted,
  PlayerJoined,
  RoomCreated,
  ThemeInputted,
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

  it("MeaningInputtedイベントで意味が追加される", () => {
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

    const event: MeaningInputted = {
      type: "MeaningInputted",
      payload: {
        roomId,
        playerId,
        theme: "お題",
        meaning: "意味",
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
});
