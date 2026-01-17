---
trigger: glob
globs: packages/backend/**/*.ts
---

# Backend Implementation Guidelines

This document serves as a guide for future agents implementation the backend application.
It summarizes the architectural decisions and coding standards established so far.

## 1. Architectural Style
- **Package by Feature**: Code is organized by feature modules (e.g., \`modules/room\`) containing their own Domain, Application, and Infrastructure layers.
- **Functional Event Sourcing**: The system uses Event Sourcing with a functional approach (Decider/Evolver patterns).
- **Socket.IO**: Communication is primarily event-based via WebSockets.

## 2. Directory Structure
\`\`\`
packages/backend/src/
  ├── modules/
  │   └── <feature>/           # e.g., room
  │       ├── domain/          # Pure domain logic (Decider, Evolver, Types, Events)
  │       ├── application/     # Use Cases (Orchestration)
  │       └── infrastructure/  # Repositories, feature-specific infra
  ├── shared/
  │   ├── event/               # DomainEvent definition
  │   ├── infrastructure/      # EventStore interface & implementation
  │   └── types.ts             # Shared types (Result pattern, etc.)
  └── server.ts                # Entry point, Composition Root, Socket.IO setup
\`\`\`

## 3. Implementation Patterns

### Functional Event Sourcing
- **Decider (Command -> Events)**:
  - Logic MUST be pure functions.
  - \`decideAction(params): Result<Event[], DomainError>\`
  - Do NOT mutate state directly. Returns events that *will* change state.
- **Evolver (State + Event -> State)**:
  - \`evolve(currentState, event): NewState\`
  - Used to rebuild state from history and to calculate the new state after a command.
  - Do NOT validate state and parameter.
- **Event Store**:
  - Events are persisted using \`EventStore\`.
  - **Concurrency Control**: Must use \`expectedEventCount\` when saving to ensure the stream hasn't changed.
  - **Ordering**: \`load\` must return events sorted by \`occurredAt\`.

### Domain Modeling
- **Discriminated Unions**:
  - Use Discriminated Unions to represent entity states (e.g., \`WaitingRoom | PlayingRoom\`).
  - This prevents invalid states (e.g., accessing 'theme' in a waiting room) at the type level.
- **Minimalism (YAGNI)**:
  - Only define fields and states that are currently in use.
  - If a Union has only one member currently, define it as an alias (e.g., \`type Room = WaitingRoom\`).
  - Avoid redundant data (e.g., do not add \`isHost\` boolean if \`hostId\` already exists).

### Repository & Use Cases
- **Repositories**:
  - Responsible for saving events and replaying them to rebuild state/entity.
  - \`findById(id)\`: Loads events -> calls \`evolve\` recursively -> returns Entity.
  - \`save(id, events, expectedEventCount)\`: Persists new events.
- **Use Cases**:
  - Orchestrate the flow: Load -> Decide -> Evolve (for response) -> Save.
  - Return `Result` types, avoid throwing exceptions for domain errors.

## 4. Common Types
- **Result<T, E>**: Use the \`Result\` type for all operations that can fail implementation logic.