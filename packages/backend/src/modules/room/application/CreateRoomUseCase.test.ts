import { describe, expect, it, vi } from "vitest";
import { err, ok } from "../../../shared/types";
import type { RoomRepository } from "../domain/RoomRepository";
import { CreateRoomUseCase } from "./CreateRoomUseCase";

describe("CreateRoomUseCase", () => {
  const createMockRepo = () =>
    ({
      save: vi.fn(),
      findById: vi.fn(),
    }) as unknown as RoomRepository;

  it("ルームを正常に作成できる", async () => {
    // Arrange
    const mockRepo = createMockRepo();
    vi.mocked(mockRepo.save).mockResolvedValue(ok(undefined));
    const useCase = new CreateRoomUseCase(mockRepo);

    // Act
    const result = await useCase.execute("TestUser");

    // Assert
    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    const { room, playerId } = successResult.value;
    expect(room.id).toBeDefined();
    expect(playerId).toBeDefined();

    const player = room.players.find((p) => p.id === playerId);
    expect(player).toBeDefined();
    expect(player?.name).toBe("TestUser");

    // Verify repository was called
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const [roomId, events] = vi.mocked(mockRepo.save).mock.calls[0];
    expect(roomId).toBe(room.id);
    expect(events).toHaveLength(1);
  });

  it("プレイヤー名が空の場合、エラーを返す（ドメインバリデーション）", async () => {
    // Arrange
    const mockRepo = createMockRepo();
    const useCase = new CreateRoomUseCase(mockRepo);

    // Act
    const result = await useCase.execute("");

    // Assert
    expect(result.success).toBe(false);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("リポジトリの保存が失敗した場合、エラーを返す", async () => {
    // Arrange
    const mockRepo = createMockRepo();
    vi.mocked(mockRepo.save).mockResolvedValue(err({ type: "DomainError", message: "DB Error" }));
    const useCase = new CreateRoomUseCase(mockRepo);

    // Act
    const result = await useCase.execute("TestUser");

    // Assert
    expect(result.success).toBe(false);
  });
});
