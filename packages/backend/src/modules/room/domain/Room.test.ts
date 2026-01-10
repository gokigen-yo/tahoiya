import { describe, expect, it } from "vitest";
import {
  decideCreateRoom,
  decideJoinRoom,
  evolve,
  type PlayerJoined,
  type RoomCreated,
  type WaitingForJoinRoom,
} from "./Room";

describe("decideCreateRoom", () => {
  it("RoomCreatedイベントを返す", () => {
    const result = decideCreateRoom("TestPlayer");

    expect(result.success).toBe(true);

    // Explicitly cast to Ok type or just access value assuming success
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as RoomCreated;
    expect(event.type).toBe("RoomCreated");
    expect(event.payload.hostName).toBe("TestPlayer");
    expect(event.payload.roomId).toBeDefined();
    expect(event.payload.hostId).toBeDefined();
  });

  it("プレイヤー名が空の場合、エラーを返す", () => {
    const result = decideCreateRoom("");

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
    const result = decideJoinRoom(room, "Joiner", 1);

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value).toHaveLength(1);
    const event = successResult.value[0] as PlayerJoined;
    expect(event.type).toBe("PlayerJoined");
    expect(event.payload.playerName).toBe("Joiner");
    expect(event.payload.roomId).toBe(room.id);
    expect(event.payload.playerId).toBeDefined();
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
    const result = decideJoinRoom(room, "Joiner", 1);

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
    const result = decideJoinRoom(room, "Joiner", 1);

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

    const result = decideJoinRoom(room, "", 1);

    expect(result.success).toBe(false);
  });
});

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
});
