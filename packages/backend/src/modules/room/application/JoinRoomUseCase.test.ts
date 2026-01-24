import { describe, expect, it, vi } from "vitest";
import { ok } from "../../../shared/types";
import type { WaitingForJoinRoom } from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";
import { JoinRoomUseCase } from "./JoinRoomUseCase";

describe("JoinRoomUseCase", () => {
  const createMockRepo = () =>
    ({
      findById: vi.fn(),
      save: vi.fn(),
    }) as unknown as RoomRepository;

  it("新しいプレイヤーが既存のルームに参加できる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new JoinRoomUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: WaitingForJoinRoom = {
      id: roomId,
      phase: "waiting_for_join",
      players: [{ id: "host", name: "Host", score: 0 }],
      hostId: "host",
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerName: "Joiner",
    });

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.players).toHaveLength(2);
    expect(successResult.value.room.players[1].name).toBe("Joiner");
    expect(successResult.value.playerId).toBeDefined();

    expect(mockRoomRepository.save).toHaveBeenCalled();
  });

  it("既存のプレイヤーIDで再参加できる（冪等性）", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new JoinRoomUseCase(mockRoomRepository);
    const roomId = "room-1";
    const hostId = "host";
    const existingRoom: WaitingForJoinRoom = {
      id: roomId,
      phase: "waiting_for_join",
      players: [{ id: "host", name: "Host", score: 0 }],
      hostId: "host",
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );

    // Act
    const result = await useCase.execute({
      roomId,
      playerName: "Host", // Name might differ but ID matches
      playerId: hostId,
    });

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.playerId).toBe(hostId);
    // Should NOT save new events
    expect(mockRoomRepository.save).not.toHaveBeenCalled();
  });

  it("ルームが見つからない場合はエラー", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new JoinRoomUseCase(mockRoomRepository);
    vi.mocked(mockRoomRepository.findById).mockResolvedValue({
      success: false,
      error: { type: "DomainError", message: "Room not found" },
    });

    // Act
    const result = await useCase.execute({
      roomId: "unknown",
      playerName: "Joiner",
    });

    // Assert
    expect(result.success).toBe(false);
  });
});
