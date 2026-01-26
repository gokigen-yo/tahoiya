import { describe, expect, it, vi } from "vitest";
import { ok } from "../../../shared/types";
import type { VotingRoom } from "../domain/Room";
import type { RoomRepository } from "../domain/RoomRepository";
import { VoteUseCase } from "./VoteUseCase";

describe("VoteUseCase", () => {
  const createMockRepo = () =>
    ({
      findById: vi.fn(),
      save: vi.fn(),
    }) as RoomRepository;

  it("子プレイヤーが投票できる", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new VoteUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: VotingRoom = {
      id: roomId,
      phase: "voting",
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
        { playerId: "player_id_1", text: "Correct", choiceIndex: 1 },
        { playerId: "player_id_2", text: "Fake1", choiceIndex: 2 },
        { playerId: "player_id_3", text: "Fake2", choiceIndex: 3 },
      ],
      votes: [],
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_2",
      choiceIndex: 3, // Vote for Child2's fake
      betPoints: 1,
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("voting");
    const room = successResult.value.room as VotingRoom;
    expect(room.votes).toHaveLength(1);
  });

  it("全員（子）が投票完了すると結果発表フェーズに移行する", async () => {
    // Arrange
    const mockRoomRepository = createMockRepo();
    const useCase = new VoteUseCase(mockRoomRepository);
    const roomId = "room-1";
    const existingRoom: VotingRoom = {
      id: roomId,
      phase: "voting",
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
        { playerId: "player_id_1", text: "Correct", choiceIndex: 1 },
        { playerId: "player_id_2", text: "Fake1", choiceIndex: 2 },
        { playerId: "player_id_3", text: "Fake2", choiceIndex: 3 },
      ],
      votes: [{ playerId: "player_id_2", choiceIndex: 3, betPoints: 1 }],
    };

    vi.mocked(mockRoomRepository.findById).mockResolvedValue(
      ok({ room: existingRoom, version: 1 }),
    );
    vi.mocked(mockRoomRepository.save).mockResolvedValue(ok(undefined));

    // Act
    const result = await useCase.execute({
      roomId,
      playerId: "player_id_3",
      choiceIndex: 1, // Vote for Correct
      betPoints: 3,
    });

    // Assert
    expect(result.success).toBe(true);
    const successResult = result as Extract<typeof result, { success: true }>;
    expect(successResult.value.room.phase).toBe("round_result");
  });
});
