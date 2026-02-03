import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type {
  MeaningInputState,
  ThemeInputState,
  WaitingForJoinState,
} from "@/features/room/types/RoomStateResponse";
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

  describe("お題入力フェーズ（theme_input）", () => {
    it("親プレイヤーの場合、お題入力フォームが表示され送信できる", async () => {
      const user = userEvent.setup();
      render(<RoomContainer roomId={roomId} playerId={playerId} />);

      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      const mockState: ThemeInputState = {
        phase: "theme_input",
        roomId,
        hostId: "host-id",
        players: [{ id: playerId, name: "自分", score: 0 }],
        round: 1,
        parentPlayerId: playerId, // 自分が親
      };

      await waitFor(() => {
        updateHandler({ gameState: mockState });
      });

      expect(canvasElement().getByText(/あなたは親です/)).toBeInTheDocument();
      const input = screen.getByPlaceholderText("お題（単語）を入力");
      await user.type(input, "テストお題");
      await user.click(screen.getByRole("button", { name: "決定" }));

      // 送信後、フェーズが遷移した状態をシミュレート
      const nextState: MeaningInputState = {
        phase: "meaning_input",
        roomId,
        hostId: "host-id",
        players: [{ id: playerId, name: "自分", score: 0, hasSubmitted: false }],
        round: 1,
        parentPlayerId: playerId,
        theme: "テストお題",
      };

      await waitFor(() => {
        updateHandler({ gameState: nextState });
      });

      // 遷移後の画面（意味入力）が表示されていることを確認
      expect(screen.getByText("テストお題")).toBeInTheDocument();
      expect(screen.getByText(/正しい意味/)).toBeInTheDocument();
      expect(screen.getByText(/入力してください/)).toBeInTheDocument();
    });

    it("子プレイヤーの場合、待機画面が表示される", async () => {
      render(<RoomContainer roomId={roomId} playerId={playerId} />);

      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      const mockState: ThemeInputState = {
        phase: "theme_input",
        roomId,
        hostId: "host-id",
        players: [
          { id: playerId, name: "自分", score: 0 },
          { id: "parent-id", name: "親プレイヤー", score: 0 },
        ],
        round: 1,
        parentPlayerId: "parent-id", // 相手が親
      };

      await waitFor(() => {
        updateHandler({ gameState: mockState });
      });

      expect(screen.getByText(/親（親プレイヤー）がお題を考えています/)).toBeInTheDocument();
    });
  });

  describe("意味入力フェーズ（meaning_input）", () => {
    const setupMeaningInput = async (isParent: boolean) => {
      render(<RoomContainer roomId={roomId} playerId={playerId} />);
      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      const mockState: MeaningInputState = {
        phase: "meaning_input",
        roomId,
        hostId: "host-id",
        players: [{ id: playerId, name: "自分", score: 0, hasSubmitted: false }],
        round: 1,
        parentPlayerId: isParent ? playerId : "parent-id",
        theme: "たほいや",
      };

      await waitFor(() => {
        updateHandler({ gameState: mockState });
      });

      return { updateHandler, mockState };
    };

    it("親プレイヤーの場合、正しい意味の入力案内が表示される", async () => {
      const user = userEvent.setup();
      const { updateHandler, mockState } = await setupMeaningInput(true);

      expect(screen.getByText("たほいや")).toBeInTheDocument();
      expect(screen.getByText(/正しい意味/)).toBeInTheDocument();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "本当の意味");
      await user.click(screen.getByRole("button", { name: "決定" }));

      // 自分が「送信済み」になった状態をシミュレート
      const nextState: MeaningInputState = {
        ...mockState,
        players: [{ id: playerId, name: "自分", score: 0, hasSubmitted: true }],
      };

      await waitFor(() => {
        updateHandler({ gameState: nextState });
      });

      expect(screen.getByText("たほいや")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("子プレイヤーが未送信の場合、入力フォームが表示され、送信後に待機画面に切り替わる", async () => {
      const user = userEvent.setup();
      const { updateHandler, mockState } = await setupMeaningInput(false);

      expect(screen.getByText("たほいや")).toBeInTheDocument();
      expect(screen.getByText(/嘘の意味/)).toBeInTheDocument();

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "嘘の意味");
      await user.click(screen.getByRole("button", { name: "決定" }));

      // 自分が「送信済み」になった状態をシミュレート
      const nextState: MeaningInputState = {
        ...mockState,
        players: [{ id: playerId, name: "自分", score: 0, hasSubmitted: true }],
      };

      await waitFor(() => {
        updateHandler({ gameState: nextState });
      });

      expect(screen.getByText("送信しました！")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });
});

// ヘルパー: Storybookのテストユーティリティに似た挙動
function canvasElement() {
  return within(document.body);
}

import { within } from "@testing-library/react";
