import { describe, expect, it } from "vitest";
import { createEvent } from "../event/DomainEvent";
import { InMemoryEventStore } from "./InMemoryEventStore";

describe("InMemoryEventStore", () => {
  it("イベントを保存およびロードできる", async () => {
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 }, 1);

    await store.save(streamId, [event1]);

    const loadedEvents = await store.load(streamId);
    expect(loadedEvents).toHaveLength(1);
    expect(loadedEvents[0].type).toBe("TestEvent");
  });

  it("期待されるイベント数（expectedEventCount）を強制する", async () => {
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 }, 1);

    await store.save(streamId, [event1]);

    const event2 = createEvent("TestEvent", { data: 2 }, 3); // Wrong version (expected 2)

    // Should fail if version is wrong
    await expect(store.save(streamId, [event2])).rejects.toThrow();

    // Should succeed with correct version
    const event2Correct = createEvent("TestEvent", { data: 2 }, 2);
    await store.save(streamId, [event2Correct]);
  });

  it("イベントをバージョン順にロードする", async () => {
    const store = new InMemoryEventStore();
    const streamId = "stream-sort";

    const event1 = createEvent("Event1", {}, 1);
    const event2 = createEvent("Event2", {}, 2);

    // No need to tweak timestamps, sorting is by version

    // Save in reverse order? or save separately
    // Let's save them together.
    await store.save(streamId, [event1]);
    await store.save(streamId, [event2]);

    const loaded = await store.load(streamId);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].type).toBe("Event1"); // Earlier time first
    expect(loaded[1].type).toBe("Event2");
  });
});
