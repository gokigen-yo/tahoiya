import { describe, expect, it } from "vitest";
import { createEvent } from "../event/DomainEvent";
import { InMemoryEventStore } from "./InMemoryEventStore";

describe("InMemoryEventStore", () => {
  it("イベントを保存およびロードできる", async () => {
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 });

    await store.save(streamId, [event1], 0);

    const loadedEvents = await store.load(streamId);
    expect(loadedEvents).toHaveLength(1);
    expect(loadedEvents[0].type).toBe("TestEvent");
  });

  it("期待されるイベント数（expectedEventCount）を強制する", async () => {
    const store = new InMemoryEventStore();
    const streamId = "stream-1";
    const event1 = createEvent("TestEvent", { data: 1 });

    await store.save(streamId, [event1], 0);

    const event2 = createEvent("TestEvent", { data: 2 });

    // Should fail if expectedEventCount is wrong (0 instead of 1)
    await expect(store.save(streamId, [event2], 0)).rejects.toThrow();

    // Should succeed with correct count
    await store.save(streamId, [event2], 1);
  });

  it("イベントを発生時刻（occurredAt）順にロードする", async () => {
    const store = new InMemoryEventStore();
    const streamId = "stream-sort";

    const event1 = createEvent("Event1", {});
    const event2 = createEvent("Event2", {});

    // Manually tweak timestamps to ensure order (though insertion order usually wins in map impl unless we sort)
    // Our implementation currently sorts by time.
    event1.occurredAt = new Date(1000);
    event2.occurredAt = new Date(2000);

    // Save in reverse order? or save separately
    // Let's save them together.
    await store.save(streamId, [event2, event1], 0);

    const loaded = await store.load(streamId);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].type).toBe("Event1"); // Earlier time first
    expect(loaded[1].type).toBe("Event2");
  });
});
