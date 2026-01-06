import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);

  console.log("Emitting create_room...");
  socket.emit("create_room", { playerName: "TestUser" });
});

socket.on("room_created", (data) => {
  console.log("room_created received:", JSON.stringify(data, null, 2));

  if (data.roomId && data.playerId && data.gameState) {
    console.log("SUCCESS: Room created successfully.");
  } else {
    console.error("FAILURE: Invalid payload structure.");
  }

  socket.disconnect();
  process.exit(0);
});

socket.on("error", (err) => {
  console.error("Error received:", err);
  socket.disconnect();
  process.exit(1);
});

// Timeout
setTimeout(() => {
  console.error("Timeout waiting for response");
  socket.disconnect();
  process.exit(1);
}, 5000);
