---
trigger: glob
globs: packages/backend/**/*.test.ts
---

# Backend Unit Testing Guidelines

This document outlines the unit testing guidelines for backend workspace.

## 1. Test Framework
- **Vitest**: Used as the test runner.
- **Run command**: \`pnpm test\` (in \`packages/backend\`).

## 2. File Location & Naming
- **Co-location**: Test files must be placed alongside the implementation files.
- **Naming**: \`[filename].test.ts\` (e.g., \`Room.ts\` -> \`Room.test.ts\`).

## 3. Test Case Naming Convention
- **Language**: **Japanese**.
- **Style**: Natural sentences.

## 4. Testing Strategy by Layer

- **Prohibited**: Do NOT use conditional logic (if/else) in tests. Use assertions that fail if conditions aren't met, or type casting after assertions.
- **Prohibited**: Do NOT verify error messages (e.g., `toThrow('Message')` or `expect(err.message).toBe(...)`). Verify only that an error occurred (e.g., `toThrow()` or `expect(result.success).toBe(false)`).
### Domain Layer (e.g., \`Room.ts\`)
- **Type**: Pure Unit Tests.
- **Focus**: Verify logic in Decider (\`decide...\`) and Evolver (\`evolve\`) functions.
- **No Mocks**: Test pure functions directly.

### Application Layer (e.g., \`CreateRoomUseCase.ts\`)
- **Type**: Unit Tests with Mocks.
- **Focus**: Verify orchestration and error handling.
- **Mocks**: Mock Repositories/Services to isolate the Use Case.

### Infrastructure Layer (e.g., \`InMemoryRoomRepository.ts\`)
- **Type**: Integration/Unit Tests.
- **Focus**: Verify persistence, rehydration, and concurrency controls.
- **Real Deps**: Use real (in-memory) dependencies like \`InMemoryEventStore\` where possible to verify behavior.