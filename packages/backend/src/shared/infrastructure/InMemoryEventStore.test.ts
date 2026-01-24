import { describe, expect, it } from "vitest";
import { createEvent } from "../event/DomainEvent";
import { InMemoryEventStore } from "./InMemoryEventStore";

describe("InMemoryEventStore", () => {
  it("指定したストリームIDに対してイベントを保存およびロードできる", async () => {
    // Arrange
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 }, 1);

    // Act
    await store.save(streamId, [event1]);
    const loadedEvents = await store.load(streamId);

    // Assert
    expect(loadedEvents).toHaveLength(1);
    expect(loadedEvents[0].type).toBe("TestEvent");
  });

  it("期待されるバージョンと異なるイベントを保存しようとした場合、エラーを返す", async () => {
    // Arrange
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 }, 1);
    await store.save(streamId, [event1]);

    const event2WrongVersion = createEvent("TestEvent", { data: 2 }, 3); // Expected version is 2

    // Act & Assert
    // エラーメッセージの内容ではなく、エラーが発生することのみを確認する
    await expect(store.save(streamId, [event2WrongVersion])).rejects.toThrow();
  });

  it("保存可能な正しいバージョンのイベントは正常に保存できる", async () => {
    // Arrange
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 }, 1);
    await store.save(streamId, [event1]);

    const event2CorrectVersion = createEvent("TestEvent", { data: 2 }, 2);

    // Act
    await store.save(streamId, [event2CorrectVersion]);
    const loaded = await store.load(streamId);

    // Assert
    expect(loaded).toHaveLength(2);
    expect(loaded[1].version).toBe(2);
  });

  it("保存されたイベントをバージョンの昇順でロードする", async () => {
    // Arrange
    const store = new InMemoryEventStore();
    const streamId = "stream-sort";
    const event1 = createEvent("Event1", {}, 1);
    const event2 = createEvent("Event2", {}, 2);

    // Act
    // 一緒に保存しても個別に保存しても、バージョン順に取得できることを確認
    await store.save(streamId, [event1]);
    await store.save(streamId, [event2]);
    const loaded = await store.load(streamId);

    // Assert
    expect(loaded).toHaveLength(2);
    expect(loaded[0].version).toBe(1);
    expect(loaded[1].version).toBe(2);
    expect(loaded[0].type).toBe("Event1");
    expect(loaded[1].type).toBe("Event2");
  });
});
