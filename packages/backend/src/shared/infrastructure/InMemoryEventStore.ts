import type { DomainEvent } from "../event/DomainEvent";
import type { EventStore } from "./EventStore";

export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  async save(streamId: string, events: DomainEvent[], expectedEventCount: number): Promise<void> {
    const currentEvents = this.events.get(streamId) || [];
    if (currentEvents.length !== expectedEventCount) {
      throw new Error(
        `Concurrency error: Expected event count ${expectedEventCount} but found ${currentEvents.length}`,
      );
    }
    this.events.set(streamId, [...currentEvents, ...events]);
  }

  async load(streamId: string): Promise<DomainEvent[]> {
    const events = this.events.get(streamId) || [];
    // Sort by occurredAt to guarantee order, especially for future RDB migration
    return [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }
}
