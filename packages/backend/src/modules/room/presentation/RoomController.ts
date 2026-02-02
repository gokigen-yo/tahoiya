import type { Server, Socket } from "socket.io";
import type { InMemorySessionStore } from "../../../shared/infrastructure/InMemorySessionStore";
import type { CreateRoomUseCase } from "../application/CreateRoomUseCase";
import type { InputMeaningUseCase } from "../application/InputMeaningUseCase";
import type { InputThemeUseCase } from "../application/InputThemeUseCase";
import type { JoinRoomUseCase } from "../application/JoinRoomUseCase";
import type { NextRoundUseCase } from "../application/NextRoundUseCase";
import type { StartGameUseCase } from "../application/StartGameUseCase";
import type { VoteUseCase } from "../application/VoteUseCase";
import { toResponse } from "./RoomStateResponse";

export class RoomController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly startGameUseCase: StartGameUseCase,
    private readonly inputThemeUseCase: InputThemeUseCase,
    private readonly inputMeaningUseCase: InputMeaningUseCase,
    private readonly voteUseCase: VoteUseCase,
    private readonly nextRoundUseCase: NextRoundUseCase,
    private readonly sessionStore: InMemorySessionStore,
  ) {}

  handle(socket: Socket, io: Server): void {
    socket.on("create_room", async (data: { playerName: string }) => {
      console.log("create_room received:", data);
      const result = await this.createRoomUseCase.execute(data.playerName);

      if (!result.success) {
        socket.emit("error", { message: result.error.message });
        return;
      }

      const { room, playerId } = result.value;
      this.sessionStore.bind(socket.id, playerId);
      socket.join(room.id);

      socket.emit("room_created", {
        roomId: room.id,
        playerId: playerId,
        gameState: toResponse(room),
      });

      console.log(`Room created: ${room.id} by player ${data.playerName} (${playerId})`);
    });

    socket.on("join_room", async (data: { roomId: string; playerName: string }) => {
      console.log("join_room received:", data);
      const result = await this.joinRoomUseCase.execute({
        roomId: data.roomId,
        playerName: data.playerName,
      });

      if (!result.success) {
        socket.emit("error", { message: result.error.message });
        return;
      }

      const { room, playerId } = result.value;
      this.sessionStore.bind(socket.id, playerId);
      socket.join(room.id);

      socket.emit("join_success", {
        roomId: room.id,
        playerId: playerId,
        gameState: toResponse(room),
      });

      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });

      console.log(`Player ${data.playerName} (${playerId}) joined room ${room.id}`);
    });

    socket.on("start_game", async (data: { roomId: string }) => {
      console.log("start_game received:", data);
      const playerId = this.sessionStore.getPlayerId(socket.id);
      if (!playerId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const result = await this.startGameUseCase.execute({ roomId: data.roomId, playerId });

      if (!result.success) {
        socket.emit("error", { message: result.error.message });
        return;
      }

      const { room } = result.value;
      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });
      console.log(`Game started in room ${room.id}`);
    });

    socket.on(
      "submit_theme",
      async (data: { roomId: string; theme: string; meaning: string; refUrl?: string }) => {
        console.log("submit_theme received:", data);
        const playerId = this.sessionStore.getPlayerId(socket.id);
        if (!playerId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const result = await this.inputThemeUseCase.execute({
          roomId: data.roomId,
          playerId,
          theme: data.theme,
        });

        if (!result.success) {
          socket.emit("error", { message: result.error.message });
          return;
        }

        const { room } = result.value;
        io.to(room.id).emit("update_game_state", {
          gameState: toResponse(room),
        });
        console.log(`Theme submitted in room ${room.id}: ${data.theme}`);
      },
    );

    socket.on("submit_meaning", async (data: { roomId: string; meaning: string }) => {
      console.log("submit_meaning received:", data);
      const playerId = this.sessionStore.getPlayerId(socket.id);
      if (!playerId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const result = await this.inputMeaningUseCase.execute({
        roomId: data.roomId,
        playerId,
        meaning: data.meaning,
      });

      if (!result.success) {
        socket.emit("error", { message: result.error.message });
        return;
      }

      const { room } = result.value;
      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });
      console.log(`Meaning submitted in room ${room.id} by ${playerId}`);
    });

    socket.on(
      "submit_vote",
      async (data: { roomId: string; choiceIndex: number; betPoints: number }) => {
        console.log("submit_vote received:", data);
        const playerId = this.sessionStore.getPlayerId(socket.id);
        if (!playerId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const result = await this.voteUseCase.execute({
          roomId: data.roomId,
          playerId,
          choiceIndex: data.choiceIndex,
          betPoints: data.betPoints,
        });

        if (!result.success) {
          socket.emit("error", { message: result.error.message });
          return;
        }

        const { room } = result.value;
        io.to(room.id).emit("update_game_state", {
          gameState: toResponse(room),
        });
        console.log(`Vote submitted in room ${room.id} by ${playerId}`);
      },
    );

    socket.on("next_round", async (data: { roomId: string }) => {
      console.log("next_round received:", data);
      const playerId = this.sessionStore.getPlayerId(socket.id);
      if (!playerId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const result = await this.nextRoundUseCase.execute({ roomId: data.roomId, playerId });

      if (!result.success) {
        socket.emit("error", { message: result.error.message });
        return;
      }

      const { room } = result.value;
      io.to(room.id).emit("update_game_state", {
        gameState: toResponse(room),
      });
      console.log(`Next round started in room ${room.id}`);
    });
  }
}
