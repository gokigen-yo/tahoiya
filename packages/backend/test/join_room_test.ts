import { io } from "socket.io-client";

// Helper to create a promise that resolves on a specific event
const waitForEvent = (socket: any, event: string) => {
  return new Promise<any>((resolve, reject) => {
    socket.once(event, (data: any) => resolve(data));
    socket.once("error", (err: any) => reject(err));
  });
};

const runTest = async () => {
  let hostSocket: any;
  let joinerSocket: any;

  try {
    // 1. Host creates room
    console.log("[Host] Connecting...");
    hostSocket = io("http://localhost:3001");

    await new Promise<void>((r) => hostSocket.on("connect", () => r()));
    console.log("[Host] Connected. Creating room...");

    hostSocket.emit("create_room", { playerName: "HostUser" });
    const roomCreatedData = await waitForEvent(hostSocket, "room_created");

    const { roomId, playerId: hostId } = roomCreatedData;
    console.log(`[Host] Room created: ${roomId}, HostID: ${hostId}`);

    // 2. Joiner joins room
    console.log("[Joiner] Connecting...");
    joinerSocket = io("http://localhost:3001");

    await new Promise<void>((r) => joinerSocket.on("connect", () => r()));
    console.log(`[Joiner] Connected. Joining room ${roomId}...`);

    joinerSocket.emit("join_room", { roomId, playerName: "JoinerUser" });

    // 3. Assertions
    // Joiner should receive join_success
    const joinSuccessData = await waitForEvent(joinerSocket, "join_success");
    console.log("[Joiner] Received join_success:", joinSuccessData);

    if (joinSuccessData.roomId !== roomId) {
      throw new Error("Join success received for wrong room");
    }

    // Both should receive update_game_state with 2 players
    console.log("Waiting for game state updates...");

    // We might get update_game_state multiple times, but eventually we want to see 2 players
    const checkGameState = (data: any) => {
      if (data.gameState && data.gameState.players.length === 2) {
        return true;
      }
      return false;
    };

    const hostGameStatePromise = new Promise<void>((resolve) => {
      hostSocket.on("update_game_state", (data: any) => {
        if (checkGameState(data)) {
          console.log("[Host] Verified 2 players in game state");
          resolve();
        }
      });
    });

    const joinerGameStatePromise = new Promise<void>((resolve) => {
      joinerSocket.on("update_game_state", (data: any) => {
        if (checkGameState(data)) {
          console.log("[Joiner] Verified 2 players in game state");
          resolve();
        }
      });
    });

    await Promise.all([hostGameStatePromise, joinerGameStatePromise]);

    console.log("SUCCESS: Join room flow verified.");
    process.exit(0);
  } catch (error) {
    console.error("Test Failed:", error);
    process.exit(1);
  } finally {
    if (hostSocket) hostSocket.disconnect();
    if (joinerSocket) joinerSocket.disconnect();
  }
};

runTest();
