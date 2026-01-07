import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { CreateRoomUseCase } from "./modules/room/application/CreateRoomUseCase";
import { JoinRoomUseCase } from "./modules/room/application/JoinRoomUseCase";
import { InMemoryRoomRepository } from "./modules/room/infrastructure/InMemoryRoomRepository";
import { InMemoryEventStore } from "./shared/infrastructure/InMemoryEventStore";
import { InMemorySessionStore } from "./shared/infrastructure/InMemorySessionStore";

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
const sessionStore = new InMemorySessionStore();
const createRoomUseCase = new CreateRoomUseCase(roomRepository);
const joinRoomUseCase = new JoinRoomUseCase(roomRepository);

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

      sessionStore.bind(socket.id, player.id);

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

  socket.on(
    "join_room",
    async (data: { roomId: string; playerName: string; playerId?: string }) => {
      console.log("join_room received:", data);
      const result = await joinRoomUseCase.execute({
        roomId: data.roomId,
        playerName: data.playerName,
        playerId: data.playerId,
      });

      if (result.success) {
        const { room, playerId } = result.value;
        const player = room.players.find((p) => p.id === playerId);

        if (player) {
          sessionStore.bind(socket.id, playerId);

          socket.join(room.id);

          socket.emit("join_success", {
            roomId: room.id,
            playerId: playerId,
          });

          io.to(room.id).emit("update_game_state", {
            gameState: room,
          });

          console.log(`Player ${player.name} (${playerId}) joined room ${room.id}`);
        }
      } else {
        socket.emit("error", { message: result.error.message });
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
