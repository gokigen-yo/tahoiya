import { describe, expect, it, vi } from "vitest";
import { ok } from "../../../shared/types";
import type { MeaningInputRoom } from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";
import { InputMeaningUseCase } from "./InputMeaningUseCase";

describe("InputMeaningUseCase", () => {
  const createMockRepo = () =>
    ({
      findById: vi.fn(),
      save: vi.fn(),
    }) as RoomRepository;

  it("プレイヤーが意味を入力できる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new InputMeaningUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: MeaningInputRoom = {
      id: roomId,
      phase: "meaning_input",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: "player_id_1",
      round: 1,
      parentPlayerId: "player_id_1",
      theme: "Theme",
      meanings: [], // No meanings yet
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_2",
      meaning: "My Meaning",
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("meaning_input");
    const room = successResult.value.room as MeaningInputRoom;
    expect(room.meanings).toHaveLength(1);
  });

  it("全プレイヤーが入力完了すると投票フェーズに移行する", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new InputMeaningUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: MeaningInputRoom = {
      id: roomId,
      phase: "meaning_input",
      players: [
        { id: "player_id_1", name: "プレイヤー1", score: 0 },
        { id: "player_id_2", name: "プレイヤー2", score: 0 },
        { id: "player_id_3", name: "プレイヤー3", score: 0 },
      ],
      hostId: "player_id_1",
      round: 1,
      parentPlayerId: "player_id_1",
      theme: "Theme",
      meanings: [
        { playerId: "player_id_1", text: "Correct Meaning" },
        { playerId: "player_id_2", text: "Fake Meaning 1" },
      ],
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_3",
      meaning: "Fake Meaning 2",
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("voting");
  });
});
