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
import { RoomController } from "./modules/room/presentation/RoomController";
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

const roomController = new RoomController(
  createRoomUseCase,
  joinRoomUseCase,
  startGameUseCase,
  inputThemeUseCase,
  inputMeaningUseCase,
  voteUseCase,
  nextRoundUseCase,
  sessionStore,
);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 疎通確認用イベント
  socket.on("ping", () => {
    console.log("Ping received from:", socket.id);
    socket.emit("pong", { message: "Pong from server!" });
  });

  roomController.handle(socket, io);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
