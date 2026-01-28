import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { CreateRoomContainer } from "./CreateRoomContainer";

// TODO: 将来的にページ遷移先のコンポーネントが実装されたら、モックを使わずに遷移をテストすることを検討する
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockEmit = vi.fn();
const mockOnce = vi.fn();
const mockSocket = {
  emit: mockEmit,
  once: mockOnce,
};
vi.mock("@/lib/socket", () => ({
  getSocket: () => mockSocket,
}));

describe("CreateRoomContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("ルーム作成に成功すると、プレイヤー参加待機画面に遷移する", async () => {
    const user = userEvent.setup();
    render(<CreateRoomContainer />);

    await user.type(screen.getByPlaceholderText("プレイヤー名を入力"), "テストプレイヤー");
    await user.click(screen.getByRole("button", { name: "ルームを作成" }));

    const roomCreatedCallback = (mockOnce as Mock).mock.calls.find(
      (call) => call[0] === "room_created",
    )?.[1];
    expect(roomCreatedCallback).toBeDefined();

    await waitFor(() => {
      roomCreatedCallback({
        roomId: "test-room-id",
        playerId: "test-player-id",
        gameState: { phase: "waiting_for_join" },
      });
    });

    // TODO: ルームページへの遷移を確認する
    // 現時点では verify しない、または mockPush が呼ばれたことのみを確認しておく
    expect(mockPush).toHaveBeenCalledWith("/rooms/test-room-id");
  });

  it("プレイヤー名が空の場合、バリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    render(<CreateRoomContainer />);

    await user.click(screen.getByRole("button", { name: "ルームを作成" }));

    expect(screen.getByText("プレイヤー名を入力してください")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ルームを作成" })).toBeEnabled();
  });

  it("サーバーからエラーが返された場合、エラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    render(<CreateRoomContainer />);

    await user.type(screen.getByPlaceholderText("プレイヤー名を入力"), "テストプレイヤー");
    await user.click(screen.getByRole("button", { name: "ルームを作成" }));

    const errorCallback = (mockOnce as Mock).mock.calls.find((call) => call[0] === "error")?.[1];

    await waitFor(() => {
      errorCallback({ message: "サーバーエラーが発生しました" });
    });
    expect(screen.getByText("サーバーエラーが発生しました")).toBeInTheDocument();
  });
});
