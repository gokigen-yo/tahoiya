import { describe, expect, it } from "vitest";
import { InMemoryEventStore } from "../../../shared/infrastructure/InMemoryEventStore";
import { decideCreateRoom } from "../domain/Room";
import { InMemoryRoomRepository } from "./InMemoryRoomRepository";

describe("InMemoryRoomRepository", () => {
  it("イベントをリプレイしてルームを保存および検索できる", async () => {
    const eventStore = new InMemoryEventStore();
    const repo = new InMemoryRoomRepository(eventStore);

    // Create some events for a room
    const result = decideCreateRoom("TestUser");
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    const events = successResult.value;
    const roomId = events[0].payload.roomId;

    // Save
    await repo.save(roomId, events);

    // Find
    const findResult = await repo.findById(roomId);

    expect(findResult.success).toBe(true);
    const roomResult = findResult as Extract<typeof findResult, { success: true }>;
    const { room, version } = roomResult.value;
    expect(room.id).toBe(roomId);
    expect(room.players[0].name).toBe("TestUser");
    expect(room.phase).toBe("waiting");
    expect(version).toBe(1);
  });

  it("ルームが見つからない場合、エラーを返す", async () => {
    const eventStore = new InMemoryEventStore();
    const repo = new InMemoryRoomRepository(eventStore);

    const result = await repo.findById("non-existent");
    expect(result.success).toBe(false);
  });
});
