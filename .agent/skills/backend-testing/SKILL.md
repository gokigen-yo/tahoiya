---
name: backend-integration-testing
description: Procedures and commands for doing integration test on the backend WebSocket APIs.
---

# Backend Integration Testing Skill

This skill provides instructions and commands for doing integration test on the `packages/backend` workspace.

## Prerequisites
- Ensure the backend server is running in a separate terminal:
  ```bash
  pnpm --filter backend dev
  ```
  The server typically runs on `http://localhost:3001` via WebSocket (Socket.IO).

## Running Manual Verification Tests
We use standalone scripts to simulate client behavior and verify WebSocket APIs.

### Command
To run a test script (e.g., `test/create_room_test.ts`), execute the following command from the project root:

```bash
cd packages/backend && ./node_modules/.bin/ts-node-dev test/<test-script-name>.ts
```

### Example: Verifying `create_room`
```bash
cd packages/backend && ./node_modules/.bin/ts-node-dev test/create_room_test.ts
```

## Adding New Tests
1. Create a new file in `packages/backend/test/` (e.g., `join_room_test.ts`).
2. Use `socket.io-client` to connect to `http://localhost:3001`.
3. Emit events and assert responses within the script.
4. Ensure to call `socket.disconnect()` and `process.exit(0)` on success, or `process.exit(1)` on failure/timeout.
