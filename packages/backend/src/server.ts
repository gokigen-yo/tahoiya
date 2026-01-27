import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { CreateRoomUseCase } from "./modules/room/application/CreateRoomUseCase";
import { InputMeaningUseCase } from "./modules/room/application/InputMeaningUseCase";
import { InputThemeUseCase } from "./modules/room/application/InputThemeUseCase";
import { JoinRoomUseCase } from "./modules/room/application/JoinRoomUseCase";
import { NextRoundUseCase } from "./modules/room/application/NextRoundUseCase";
import { StartGameUseCase } from "./modules/room/application/StartGameUseCase";
import { VoteUseCase } from "./modules/room/application/VoteUseCase";
import { InMemoryRoomRepository } from "./modules/room/infrastructure/InMemoryRoomRepository";
import { toResponse } from "./modules/room/presentation/RoomStateResponse";
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
const startGameUseCase = new StartGameUseCase(roomRepository);
const inputThemeUseCase = new InputThemeUseCase(roomRepository);
const inputMeaningUseCase = new InputMeaningUseCase(roomRepository);
const voteUseCase = new VoteUseCase(roomRepository);
const nextRoundUseCase = new NextRoundUseCase(roomRepository);

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
      const { room, playerId } = result.value;

      sessionStore.bind(socket.id, playerId);

      socket.join(room.id);

      socket.emit("room_created", {
        roomId: room.id,
        playerId: playerId,
        gameState: toResponse(room),
      });

      console.log(`Room created: ${room.id} by player ${data.playerName} (${playerId})`);
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
            gameState: toResponse(room),
          });

          console.log(`Player ${player.name} (${playerId}) joined room ${room.id}`);
        }
      } else {
        socket.emit("error", { message: result.error.message });
      }
    },
  );

  socket.on("start_game", async (data: { roomId: string }) => {
    console.log("start_game received:", data);
    const playerId = sessionStore.getPlayerId(socket.id);
    if (!playerId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    const result = await startGameUseCase.execute({ roomId: data.roomId, playerId });

    if (result.success) {
      const { room } = result.value;
      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });
      console.log(`Game started in room ${room.id}`);
    } else {
      socket.emit("error", { message: result.error.message });
    }
  });

  socket.on(
    "submit_theme",
    async (data: { roomId: string; theme: string; meaning: string; refUrl?: string }) => {
      console.log("submit_theme received:", data);
      const playerId = sessionStore.getPlayerId(socket.id);
      if (!playerId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const result = await inputThemeUseCase.execute({
        roomId: data.roomId,
        playerId,
        theme: data.theme,
      });

      if (result.success) {
        const { room } = result.value;
        io.to(room.id).emit("update_game_state", {
          gameState: toResponse(room),
        });
        console.log(`Theme submitted in room ${room.id}: ${data.theme}`);
      } else {
        socket.emit("error", { message: result.error.message });
      }
    },
  );

  socket.on("submit_meaning", async (data: { roomId: string; meaning: string }) => {
    console.log("submit_meaning received:", data);
    const playerId = sessionStore.getPlayerId(socket.id);
    if (!playerId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    const result = await inputMeaningUseCase.execute({
      roomId: data.roomId,
      playerId,
      meaning: data.meaning,
    });

    if (result.success) {
      const { room } = result.value;
      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });
      console.log(`Meaning submitted in room ${room.id} by ${playerId}`);
    } else {
      socket.emit("error", { message: result.error.message });
    }
  });

  socket.on(
    "submit_vote",
    async (data: { roomId: string; choiceIndex: number; betPoints: number }) => {
      console.log("submit_vote received:", data);
      const playerId = sessionStore.getPlayerId(socket.id);
      if (!playerId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const result = await voteUseCase.execute({
        roomId: data.roomId,
        playerId,
        choiceIndex: data.choiceIndex,
        betPoints: data.betPoints,
      });

      if (result.success) {
        const { room } = result.value;
        io.to(room.id).emit("update_game_state", {
          gameState: toResponse(room),
        });
        console.log(`Vote submitted in room ${room.id} by ${playerId}`);
      } else {
        socket.emit("error", { message: result.error.message });
      }
    },
  );

  socket.on("next_round", async (data: { roomId: string }) => {
    console.log("next_round received:", data);
    const playerId = sessionStore.getPlayerId(socket.id);
    if (!playerId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    const result = await nextRoundUseCase.execute({ roomId: data.roomId, playerId });

    if (result.success) {
      const { room } = result.value;
      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });
      console.log(`Next round started in room ${room.id}`);
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
