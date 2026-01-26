import { describe, expect, it, vi } from "vitest";
import { ok } from "../../../shared/types";
import type { RoundResultRoom, ThemeInputRoom } from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";
import { NextRoundUseCase } from "./NextRoundUseCase";

describe("NextRoundUseCase", () => {
  const createMockRepo = () =>
    ({
      findById: vi.fn(),
      save: vi.fn(),
    }) as RoomRepository;

  it("ホストが次のラウンドに進めることができる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new NextRoundUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: RoundResultRoom = {
      id: roomId,
      phase: "round_result",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: "player_id_1",
      round: 1, // 1st round finished
      parentPlayerId: "player_id_1",
      theme: "Theme",
      meanings: [],
      votes: [],
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_1",
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("theme_input");

    const room = successResult.value.room as unknown as ThemeInputRoom;
    expect(room.round).toBe(2);
  });

  it("最終ラウンド終了後はゲーム終了になる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new NextRoundUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: RoundResultRoom = {
      id: roomId,
      phase: "round_result",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: "player_id_1",
      round: 3, // Last round (3 players)
      parentPlayerId: "player_id_3",
      theme: "Theme",
      meanings: [],
      votes: [],
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_1",
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("final_result");
  });
});
