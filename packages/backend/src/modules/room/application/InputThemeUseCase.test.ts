import { describe, expect, it, vi } from "vitest";
import { ok } from "../../../shared/types";
import type { MeaningInputRoom, ThemeInputRoom } from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";
import { InputThemeUseCase } from "./InputThemeUseCase";

describe("InputThemeUseCase", () => {
  const createMockRepo = () =>
    ({
      findById: vi.fn(),
      save: vi.fn(),
    }) as RoomRepository;

  it("親プレイヤーがお題を入力できる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new InputThemeUseCase(mockRoomRepository);
    const roomId = "room-1";
    const parentId = "player_id_1";
    const existingRoom: ThemeInputRoom = {
      id: roomId,
      phase: "theme_input",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: "player_id_1",
      round: 1,
      parentPlayerId: parentId,
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: parentId,
      theme: "My Theme",
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("meaning_input");
    const room = successResult.value.room as MeaningInputRoom;
    expect(room.theme).toBe("My Theme");
    expect(mockRoomRepository.save).toHaveBeenCalled();
  });

  it("親でないプレイヤーがお題を入力しようとするとエラー", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new InputThemeUseCase(mockRoomRepository);
    const roomId = "room-1";
    const parentId = "player_id_1";
    const existingRoom: ThemeInputRoom = {
      id: roomId,
      phase: "theme_input",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: "player_id_1",
      round: 1,
      parentPlayerId: parentId,
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_2",
      theme: "My Theme",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(mockRoomRepository.save).not.toHaveBeenCalled();
  });
});
