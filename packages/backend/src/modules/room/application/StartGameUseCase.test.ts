import { describe, expect, it, vi } from "vitest";
import { ok } from "../../../shared/types";
import type { WaitingForJoinRoom } from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";
import { StartGameUseCase } from "./StartGameUseCase";

describe("StartGameUseCase", () => {
  const createMockRepo = () =>
    ({
      findById: vi.fn(),
      save: vi.fn(),
    }) as RoomRepository;

  it("ホストがゲームを開始できる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new StartGameUseCase(mockRoomRepository);
    const roomId = "room-1";
    const hostId = "player_id_1";
    const existingRoom: WaitingForJoinRoom = {
      id: roomId,
      phase: "waiting_for_join",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: hostId,
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: hostId,
    });

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("theme_input");
    expect(mockRoomRepository.save).toHaveBeenCalled();
  });

  it("ルームが見つからない場合はエラー", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new StartGameUseCase(mockRoomRepository);
    vi.mocked(mockRoomRepository.findById).mockResolvedValue({
      success: false,
      error: { type: "DomainError", message: "Room not found" },
    });

    // Act
    const result = await useCase.execute({
      roomId: "unknown",
      playerId: "player_id_1",
    });

    // Assert
    expect(result.success).toBe(false);
  });
});
