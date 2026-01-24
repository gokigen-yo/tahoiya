---
name: backend-unit-testing
description: Use this skill when writing unit tests in the backend workspace.
---

# Backend Unit Testing Skill

This skill provides guidelines and best practices for writing unit tests in the `packages/backend` workspace using vitest.

## Test Command
- `pnpm test:backend` (in project root).

## File Location & Naming
- Test files must be placed alongside the implementation files.

## Best Practices
- Japanese Descriptive Test Name: explain the behavior in natural sentences
- Arrange-Act-Assert: Clear test structure
- Test Edge Cases: Null, undefined, empty, large
- Test Error Paths: Not just happy paths

### Prohibited Patterns
- DO NOT use conditional logic in tests. 
  - Use assertions that fail if conditions aren't met, or type casting after assertions.
- DO NOT verify log and error messages. 
  - Verify only that an error occurred.
- DO NOT use independent test.
  - Make test data in each test.
  - If you want to share test data, create and use factory functions.

## Testing Strategy by Layer

### Domain Layer
- Pure Unit Tests. DO NOT use mock.

### Application Layer
- Unit Tests with Mocks.
- Verify orchestration and error handling.

### Infrastructure Layer
- Integration/Unit Tests.
- Verify persistence, rehydration, and concurrency controls.
- Use real (in-memory) dependencies like `InMemoryEventStore` where possible.
