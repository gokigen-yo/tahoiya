import type { DomainEvent } from "../event/DomainEvent";

export interface EventStore {
  save(streamId: string, events: DomainEvent<any>[], expectedEventCount: number): Promise<void>;
  load(streamId: string): Promise<DomainEvent<any>[]>;
}
