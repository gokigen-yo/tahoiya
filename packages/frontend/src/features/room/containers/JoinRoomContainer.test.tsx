import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { RoomAuthGuard } from "./RoomAuthGuard";

const mockEmit = vi.fn();
const mockOnce = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();

const mockSocket = {
  emit: mockEmit,
  once: mockOnce,
  on: mockOn,
  off: mockOff,
};
vi.mock("@/lib/socket", () => ({
  getSocket: () => mockSocket,
}));

describe("JoinRoomContainer", () => {
  const roomId = "test-room-id";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("ルーム参加に成功すると、参加フォームが消えて待機画面に切り替わる", async () => {
    const user = userEvent.setup();
    render(<RoomAuthGuard roomId={roomId} />);
    expect(screen.getByRole("heading", { name: "ルームに参加" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("プレイヤー名を入力"), "参加プレイヤー");
    await user.click(screen.getByRole("button", { name: "ルームに参加" }));

    const joinSuccessCallback = (mockOnce as Mock).mock.calls.find(
      (call) => call[0] === "join_success",
    )?.[1];
    expect(joinSuccessCallback).toBeDefined();

    await waitFor(() => {
      joinSuccessCallback({
        roomId: roomId,
        playerId: "test-player-id",
        gameState: {
          phase: "waiting_for_join",
          roomId: roomId,
          hostId: "test-player-id",
          players: [{ id: "test-player-id", name: "参加プレイヤー", score: 0 }],
        },
      });
    });

    expect(screen.queryByRole("heading", { name: "ルームに参加" })).not.toBeInTheDocument();
    // 待機ルームが表示されているはず
    expect(screen.getByText("待機ルーム")).toBeInTheDocument();
    expect(screen.getByText("参加プレイヤー")).toBeInTheDocument();
  });

  it("サーバーからエラーが返された場合、エラーメッセージが表示されフォームが残る", async () => {
    const user = userEvent.setup();
    render(<RoomAuthGuard roomId={roomId} />);

    await user.type(screen.getByPlaceholderText("プレイヤー名を入力"), "参加プレイヤー");
    await user.click(screen.getByRole("button", { name: "ルームに参加" }));

    const errorCallback = (mockOnce as Mock).mock.calls.find((call) => call[0] === "error")?.[1];

    await waitFor(() => {
      errorCallback({ message: "ルームが見つかりません" });
    });

    expect(screen.getByText("ルームが見つかりません")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ルームに参加" })).toBeInTheDocument();
  });
});
