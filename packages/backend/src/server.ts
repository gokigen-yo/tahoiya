import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { CreateRoomUseCase } from "./modules/room/application/CreateRoomUseCase";
import { InMemoryRoomRepository } from "./modules/room/infrastructure/InMemoryRoomRepository";
import { InMemoryEventStore } from "./shared/infrastructure/InMemoryEventStore";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 開発用。本番では適切なオリジンを設定する
    methods: ["GET", "POST"],
  },
});

// Composition Root
const eventStore = new InMemoryEventStore();
const roomRepository = new InMemoryRoomRepository(eventStore);
const createRoomUseCase = new CreateRoomUseCase(roomRepository);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 疎通確認用イベント
  socket.on("ping", () => {
    console.log("Ping received from:", socket.id);
    socket.emit("pong", { message: "Pong from server!" });
  });

  socket.on("create_room", async (data: { playerName: string }) => {
    console.log("create_room received:", data);
    const result = await createRoomUseCase.execute(data.playerName);

    if (result.success) {
      const { room, player } = result.value;
      socket.join(room.id);

      socket.emit("room_created", {
        roomId: room.id,
        playerId: player.id,
        gameState: room,
      });

      console.log(`Room created: ${room.id} by player ${player.name} (${player.id})`);
    } else {
      socket.emit("error", { message: result.error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
