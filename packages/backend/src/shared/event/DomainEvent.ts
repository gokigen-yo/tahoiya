export interface DomainEvent<Payload> {
  type: string;
  payload: Payload;
  occurredAt: Date;
}

// Helper to create events
export const createEvent = <P>(type: string, payload: P): DomainEvent<P> => ({
  type,
  payload,
  occurredAt: new Date(),
});
