import { describe, expect, it } from "vitest";
import { decideCreateRoom, evolve, type RoomCreated, type WaitingRoom } from "./Room";

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

describe("evolve", () => {
  it("RoomCreatedイベントからWaitingRoomを作成する", () => {
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
    };

    const newState = evolve(null, event) as WaitingRoom;

    expect(newState).toBeDefined();
    expect(newState.id).toBe(roomId);
    expect(newState.phase).toBe("waiting");
    expect(newState.hostId).toBe(hostId);
    expect(newState.players).toHaveLength(1);
    expect(newState.players[0].id).toBe(hostId);
    expect(newState.players[0].name).toBe("HostName");
    expect(newState.players[0].score).toBe(0);
  });
});
