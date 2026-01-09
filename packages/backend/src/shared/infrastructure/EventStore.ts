import type { DomainEvent } from "../event/DomainEvent";

export interface EventStore {
  save(streamId: string, events: DomainEvent<any>[]): Promise<void>;
  load(streamId: string): Promise<DomainEvent<any>[]>;
}
