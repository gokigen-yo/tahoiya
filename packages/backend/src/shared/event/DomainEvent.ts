export interface DomainEvent<Payload> {
  type: string;
  payload: Payload;
  occurredAt: Date;
  version: number;
}

// Helper to create events
export const createEvent = <P>(type: string, payload: P, version: number): DomainEvent<P> => ({
  type,
  payload,
  occurredAt: new Date(),
  version,
});
