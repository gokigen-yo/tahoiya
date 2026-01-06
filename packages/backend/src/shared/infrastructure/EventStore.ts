import type { DomainEvent } from "../event/DomainEvent";

export interface EventStore {
  save(streamId: string, events: DomainEvent[], expectedEventCount: number): Promise<void>;
  load(streamId: string): Promise<DomainEvent[]>;
}
