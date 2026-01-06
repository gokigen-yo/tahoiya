import { beforeEach, describe, expect, it, vi } from "vitest";
import { err, ok } from "../../../shared/types";
import type { RoomRepository } from "../domain/RoomRepository";
import { CreateRoomUseCase } from "./CreateRoomUseCase";

describe("CreateRoomUseCase", () => {
  let useCase: CreateRoomUseCase;
  let mockRepo: RoomRepository;

  beforeEach(() => {
    mockRepo = {
      save: vi.fn().mockResolvedValue(ok(undefined)),
      findById: vi.fn(),
    };
    useCase = new CreateRoomUseCase(mockRepo);
  });

  it("ルームを正常に作成できる", async () => {
    const result = await useCase.execute("TestUser");

    expect(result.success).toBe(true);

    const successResult = result as Extract<typeof result, { success: true }>;
    const { room, player } = successResult.value;
    expect(room.id).toBeDefined();
    expect(player.name).toBe("TestUser");

    // Verify repository was called
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const [roomId, events, expectedEventCount] = vi.mocked(mockRepo.save).mock.calls[0];
    expect(roomId).toBe(room.id);
    expect(events).toHaveLength(1);
    expect(expectedEventCount).toBe(0);
  });

  it("プレイヤー名が空の場合、エラーを返す（ドメインバリデーション）", async () => {
    const result = await useCase.execute("");

    expect(result.success).toBe(false);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("リポジトリの保存が失敗した場合、エラーを返す", async () => {
    mockRepo.save = vi.fn().mockResolvedValue(err({ type: "DomainError", message: "DB Error" }));

    const result = await useCase.execute("TestUser");

    expect(result.success).toBe(false);
  });
});
