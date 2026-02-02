import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { WaitingForJoinState } from "@/features/room/types/RoomStateResponse";
import { render, screen, waitFor } from "@/test/test-utils";
import { RoomContainer } from "./RoomContainer";

const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockSocket = {
  emit: mockEmit,
  on: mockOn,
  off: mockOff,
  once: vi.fn(),
};
vi.mock("@/lib/socket", () => ({
  getSocket: () => mockSocket,
}));

describe("RoomContainer", () => {
  const roomId = "test-room-id";
  const playerId = "player-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態ではローディングが表示される", () => {
    render(<RoomContainer roomId={roomId} playerId={playerId} />);
    expect(screen.getByText("ルーム情報を取得中...")).toBeInTheDocument();
  });

  it("update_game_stateイベントを受け取ると、待機画面が表示される", async () => {
    render(<RoomContainer roomId={roomId} playerId={playerId} />);

    // イベントハンドラを取得
    const updateHandler = (mockOn as Mock).mock.calls.find(
      (call) => call[0] === "update_game_state",
    )?.[1];

    expect(updateHandler).toBeDefined();

    // 状態更新をシミュレート
    const mockState: WaitingForJoinState = {
      phase: "waiting_for_join",
      roomId,
      hostId: playerId, // 自分がホスト
      players: [
        { id: playerId, name: "自分", score: 0 },
        { id: "player-2", name: "相手", score: 0 },
      ],
    };

    await waitFor(() => {
      updateHandler({ gameState: mockState });
    });

    expect(screen.getByText("待機ルーム")).toBeInTheDocument();
    expect(screen.getByText("自分")).toBeInTheDocument();
    expect(screen.getByText("相手")).toBeInTheDocument();
    // ホストなので開始ボタンがある
    expect(screen.getByRole("button", { name: "ゲームを開始する" })).toBeInTheDocument();
  });

  it("ゲーム開始ボタンを押すとstart_gameイベントが送信される", async () => {
    const user = userEvent.setup();
    render(<RoomContainer roomId={roomId} playerId={playerId} />);

    const updateHandler = (mockOn as Mock).mock.calls.find(
      (call) => call[0] === "update_game_state",
    )?.[1];

    const mockState: WaitingForJoinState = {
      phase: "waiting_for_join",
      roomId,
      hostId: playerId,
      players: [
        { id: playerId, name: "自分", score: 0 },
        { id: "player-2", name: "相手", score: 0 },
      ],
    };

    await waitFor(() => {
      updateHandler({ gameState: mockState });
    });

    await user.click(screen.getByRole("button", { name: "ゲームを開始する" }));

    expect(mockEmit).toHaveBeenCalledWith("start_game", { roomId });
  });
});
