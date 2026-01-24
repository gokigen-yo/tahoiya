import { describe, expect, it } from "vitest";
import { InMemoryEventStore } from "../../../shared/infrastructure/InMemoryEventStore";
import { decideCreateRoom } from "../domain/RoomDecider";
import { InMemoryRoomRepository } from "./InMemoryRoomRepository";

describe("InMemoryRoomRepository", () => {
  it("イベントを保存でき、リプレイしてルームの状態を復元できる", async () => {
    // Arrange
    const eventStore = new InMemoryEventStore();
    const repo = new InMemoryRoomRepository(eventStore);
    const roomId = "room-1";
    const result = decideCreateRoom(roomId, "host-1", "TestUser");

    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    const events = successResult.value;

    // Act
    await repo.save(roomId, events);
    const findResult = await repo.findById(roomId);

    // Assert
    expect(findResult.success).toBe(true);
    const roomResult = findResult as Extract<typeof findResult, { success: true }>;
    const { room, version } = roomResult.value;
    expect(room.id).toBe(roomId);
    expect(room.players[0].name).toBe("TestUser");
    expect(room.phase).toBe("waiting_for_join");
    expect(version).toBe(1);
  });

  it("存在しないルームIDで検索した場合、エラーを返す", async () => {
    // Arrange
    const eventStore = new InMemoryEventStore();
    const repo = new InMemoryRoomRepository(eventStore);

    // Act
    const result = await repo.findById("non-existent");

    // Assert
    expect(result.success).toBe(false);
  });
});
