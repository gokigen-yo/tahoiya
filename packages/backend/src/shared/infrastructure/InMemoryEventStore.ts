import type { DomainEvent } from "../event/DomainEvent";
import type { EventStore } from "./EventStore";

export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent<any>[]> = new Map();

  async save(streamId: string, events: DomainEvent<any>[]): Promise<void> {
    const currentEvents = this.events.get(streamId) || [];
    const currentVersion = currentEvents.length;

    if (events.length === 0) return;

    // Concurrency check: The first new event's version must be currentVersion + 1
    const expectedNextVersion = currentVersion + 1;
    if (events[0].version !== expectedNextVersion) {
      throw new Error(
        `Concurrency error: Expected version ${expectedNextVersion} but found ${events[0].version}`,
      );
    }
    this.events.set(streamId, [...currentEvents, ...events]);
  }

  async load(streamId: string): Promise<DomainEvent<any>[]> {
    const events = this.events.get(streamId) || [];
    // Sort by version to guarantee order
    return [...events].sort((a, b) => a.version - b.version);
  }
}
