import type { Server, Socket } from "socket.io";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";
import { InMemorySessionStore } from "../../../shared/infrastructure/InMemorySessionStore";
import { ok } from "../../../shared/types";
import type { CreateRoomUseCase } from "../application/CreateRoomUseCase";
import type { InputMeaningUseCase } from "../application/InputMeaningUseCase";
import type { InputThemeUseCase } from "../application/InputThemeUseCase";
import type { JoinRoomUseCase } from "../application/JoinRoomUseCase";
import type { NextRoundUseCase } from "../application/NextRoundUseCase";
import type { StartGameUseCase } from "../application/StartGameUseCase";
import type { VoteUseCase } from "../application/VoteUseCase";
import type {
  MeaningInputRoom,
  ThemeInputRoom,
  VotingRoom,
  WaitingForJoinRoom,
} from "../domain/Room";
import { RoomController } from "./RoomController";

describe("RoomController", () => {
  let roomController: RoomController;
  let mockIo: Mocked<Server>;
  let mockCreateRoomUseCase: Mocked<CreateRoomUseCase>;
  let mockJoinRoomUseCase: Mocked<JoinRoomUseCase>;
  let mockStartGameUseCase: Mocked<StartGameUseCase>;
  let mockInputThemeUseCase: Mocked<InputThemeUseCase>;
  let mockInputMeaningUseCase: Mocked<InputMeaningUseCase>;
  let mockVoteUseCase: Mocked<VoteUseCase>;
  let mockNextRoundUseCase: Mocked<NextRoundUseCase>;
  let sessionStore: InMemorySessionStore;
  let mockSocket: Mocked<Socket>;

  beforeEach(() => {
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    } as unknown as Mocked<Server>;
    mockCreateRoomUseCase = { execute: vi.fn() } as unknown as Mocked<CreateRoomUseCase>;
    mockJoinRoomUseCase = { execute: vi.fn() } as unknown as Mocked<JoinRoomUseCase>;
    mockStartGameUseCase = { execute: vi.fn() } as unknown as Mocked<StartGameUseCase>;
    mockInputThemeUseCase = { execute: vi.fn() } as unknown as Mocked<InputThemeUseCase>;
    mockInputMeaningUseCase = { execute: vi.fn() } as unknown as Mocked<InputMeaningUseCase>;
    mockVoteUseCase = { execute: vi.fn() } as unknown as Mocked<VoteUseCase>;
    mockNextRoundUseCase = { execute: vi.fn() } as unknown as Mocked<NextRoundUseCase>;
    sessionStore = new InMemorySessionStore();
    roomController = new RoomController(
      mockCreateRoomUseCase,
      mockJoinRoomUseCase,
      mockStartGameUseCase,
      mockInputThemeUseCase,
      mockInputMeaningUseCase,
      mockVoteUseCase,
      mockNextRoundUseCase,
      sessionStore,
    );

    mockSocket = {
      id: "socket-1",
      on: vi.fn(),
      emit: vi.fn(),
      join: vi.fn(),
    } as unknown as Mocked<Socket>;
  });

  describe("create_room", () => {
    it("create_room イベントを受信した際に正常に部屋を作成し、クライアントに通知する", async () => {
      // Arrange
      const playerName = "TestPlayer";
      const roomId = "room-123";
      const playerId = "player-456";
      const room: WaitingForJoinRoom = {
        id: roomId,
        hostId: playerId,
        players: [{ id: playerId, name: playerName, score: 10 }],
        phase: "waiting_for_join",
      };

      vi.mocked(mockCreateRoomUseCase.execute).mockResolvedValue(ok({ room, playerId }));

      roomController.handle(mockSocket, mockIo);

      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "create_room",
      )?.[1] as (data: { playerName: string }) => Promise<void>;

      // Act
      await handler({ playerName });

      // Assert
      expect(mockCreateRoomUseCase.execute).toHaveBeenCalledWith(playerName);
      expect(sessionStore.getPlayerId("socket-1")).toBe(playerId);
      expect(mockSocket.join).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith("room_created", {
        roomId,
        playerId,
        gameState: expect.objectContaining({
          phase: "waiting_for_join",
          roomId,
        }),
      });
    });
  });

  describe("join_room", () => {
    it("join_room イベントを受信した際に正常に部屋に参加し、クライアントと部屋全員に通知する", async () => {
      // Arrange
      const playerName = "NewPlayer";
      const roomId = "room-123";
      const playerId = "player-789";
      const room: WaitingForJoinRoom = {
        id: roomId,
        hostId: "host-1",
        players: [
          { id: "host-1", name: "Host", score: 10 },
          { id: playerId, name: playerName, score: 10 },
        ],
        phase: "waiting_for_join",
      };

      vi.mocked(mockJoinRoomUseCase.execute).mockResolvedValue(ok({ room, playerId }));

      roomController.handle(mockSocket, mockIo);

      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "join_room",
      )?.[1] as (data: { roomId: string; playerName: string }) => Promise<void>;

      // Act
      await handler({ roomId, playerName });

      // Assert
      expect(mockJoinRoomUseCase.execute).toHaveBeenCalledWith({ roomId, playerName });
      expect(sessionStore.getPlayerId("socket-1")).toBe(playerId);
      expect(mockSocket.join).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith("join_success", {
        roomId,
        playerId,
      });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith("update_game_state", {
        gameState: expect.objectContaining({
          phase: "waiting_for_join",
          roomId,
        }),
      });
    });
  });

  describe("game actions", () => {
    const roomId = "room-123";
    const playerId = "player-456";

    beforeEach(() => {
      sessionStore.bind("socket-1", playerId);
    });

    it("start_game イベントを受信した際に正常にゲームを開始し、全員に通知する", async () => {
      const room: ThemeInputRoom = {
        id: roomId,
        hostId: playerId,
        phase: "theme_input",
        players: [{ id: playerId, name: "Test", score: 10 }],
        round: 1,
        parentPlayerId: playerId,
      };
      mockStartGameUseCase.execute.mockResolvedValue(ok({ room }));

      roomController.handle(mockSocket, mockIo);
      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "start_game",
      )?.[1] as (data: { roomId: string }) => Promise<void>;

      await handler({ roomId });

      expect(mockStartGameUseCase.execute).toHaveBeenCalledWith({ roomId, playerId });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith("update_game_state", {
        gameState: expect.objectContaining({ phase: "theme_input" }),
      });
    });

    it("submit_theme イベントを受信した際に正常にお題を提出し、全員に通知する", async () => {
      const theme = "Test Theme";
      const room: MeaningInputRoom = {
        id: roomId,
        hostId: playerId,
        phase: "meaning_input",
        theme,
        players: [{ id: playerId, name: "Test", score: 10 }],
        meanings: [],
        round: 1,
        parentPlayerId: playerId,
      };
      mockInputThemeUseCase.execute.mockResolvedValue(ok({ room }));

      roomController.handle(mockSocket, mockIo);
      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "submit_theme",
      )?.[1] as (data: {
        roomId: string;
        theme: string;
        meaning: string;
        refUrl?: string;
      }) => Promise<void>;

      await handler({ roomId, theme, meaning: "unused", refUrl: "unused" });

      expect(mockInputThemeUseCase.execute).toHaveBeenCalledWith({ roomId, playerId, theme });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith("update_game_state", {
        gameState: expect.objectContaining({ phase: "meaning_input", theme }),
      });
    });

    it("submit_meaning イベントを受信した際に正常に意味を提出し、全員に通知する", async () => {
      const meaning = "Test Meaning";
      const room: MeaningInputRoom = {
        id: roomId,
        hostId: playerId,
        phase: "meaning_input",
        players: [{ id: playerId, name: "Test", score: 10 }],
        meanings: [],
        theme: "Test Theme",
        round: 1,
        parentPlayerId: playerId,
      };
      mockInputMeaningUseCase.execute.mockResolvedValue(ok({ room }));

      roomController.handle(mockSocket, mockIo);
      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "submit_meaning",
      )?.[1] as (data: { roomId: string; meaning: string }) => Promise<void>;

      await handler({ roomId, meaning });

      expect(mockInputMeaningUseCase.execute).toHaveBeenCalledWith({ roomId, playerId, meaning });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith("update_game_state", {
        gameState: expect.objectContaining({ phase: "meaning_input" }),
      });
    });

    it("submit_vote イベントを受信した際に正常に投票し、全員に通知する", async () => {
      const choiceIndex = 1;
      const betPoints = 2;
      const room: VotingRoom = {
        id: roomId,
        hostId: playerId,
        phase: "voting",
        players: [{ id: playerId, name: "Test", score: 10 }],
        meanings: [],
        votes: [],
        theme: "Test Theme",
        round: 1,
        parentPlayerId: playerId,
      };
      mockVoteUseCase.execute.mockResolvedValue(ok({ room }));

      roomController.handle(mockSocket, mockIo);
      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "submit_vote",
      )?.[1] as (data: { roomId: string; choiceIndex: number; betPoints: number }) => Promise<void>;

      await handler({ roomId, choiceIndex, betPoints });

      expect(mockVoteUseCase.execute).toHaveBeenCalledWith({
        roomId,
        playerId,
        choiceIndex,
        betPoints,
      });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith("update_game_state", {
        gameState: expect.objectContaining({ phase: "voting" }),
      });
    });

    it("next_round イベントを受信した際に正常に次のラウンドを開始し、全員に通知する", async () => {
      const room: ThemeInputRoom = {
        id: roomId,
        hostId: playerId,
        phase: "theme_input",
        players: [{ id: playerId, name: "Test", score: 10 }],
        round: 2,
        parentPlayerId: playerId,
      };
      mockNextRoundUseCase.execute.mockResolvedValue(ok({ room }));

      roomController.handle(mockSocket, mockIo);
      const calls = vi.mocked(mockSocket.on).mock.calls;
      const handler = calls.find(
        (call: [string, unknown]) => call[0] === "next_round",
      )?.[1] as (data: { roomId: string }) => Promise<void>;

      await handler({ roomId });

      expect(mockNextRoundUseCase.execute).toHaveBeenCalledWith({ roomId, playerId });
      expect(mockIo.to).toHaveBeenCalledWith(roomId);
      expect(mockIo.emit).toHaveBeenCalledWith("update_game_state", {
        gameState: expect.objectContaining({ phase: "theme_input" }),
      });
    });
  });
});
