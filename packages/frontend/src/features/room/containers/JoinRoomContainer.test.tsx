import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { RoomAuthGuard } from "./RoomAuthGuard";

const mockEmit = vi.fn();
const mockOnce = vi.fn();
const mockSocket = {
  emit: mockEmit,
  once: mockOnce,
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

  it("ルーム参加に成功すると、参加フォームが消えてプレイヤー情報の画面に切り替わる", async () => {
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
      });
    });

    expect(screen.queryByRole("heading", { name: "ルームに参加" })).not.toBeInTheDocument();
    expect(screen.getByText(/参加中プレイヤーID:/)).toBeInTheDocument();
    expect(screen.getByText("test-player-id")).toBeInTheDocument();
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
