import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type {
  MeaningInputState,
  ThemeInputState,
  VotingState,
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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
        { id: "player-2", name: "相手1", score: 0 },
        { id: "player-3", name: "相手2", score: 0 },
      ],
    };

    await waitFor(() => {
      updateHandler({ gameState: mockState });
    });

    expect(screen.getByText("待機ルーム")).toBeInTheDocument();
    // 右タブと合わせて2つ
    expect(screen.getAllByText("自分")).toHaveLength(2);
    expect(screen.getAllByText("相手1")).toHaveLength(2);
    expect(screen.getAllByText("相手2")).toHaveLength(2);
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
        { id: "player-2", name: "相手1", score: 0 },
        { id: "player-3", name: "相手2", score: 0 },
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
          { id: "player-3", name: "相手2", score: 0 },
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

  describe("投票フェーズ（voting）", () => {
    const setupVoting = async (hasVoted: boolean, isParent: boolean = false) => {
      render(<RoomContainer roomId={roomId} playerId={playerId} />);
      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      const mockState: VotingState = {
        phase: "voting",
        roomId,
        hostId: "host-id",
        players: [{ id: playerId, name: "自分", score: 0, hasVoted }],
        round: 1,
        parentPlayerId: isParent ? playerId : "parent-id",
        theme: "たほいや",
        meanings: [
          { choiceIndex: 0, text: "正解の意味" },
          { choiceIndex: 1, text: "嘘の意味1" },
        ],
      };

      await waitFor(() => {
        updateHandler({ gameState: mockState });
      });

      return { updateHandler, mockState };
    };

    it("子プレイヤーが未投票の場合、投票フォームが表示され、投票後に待機画面に切り替わる", async () => {
      const user = userEvent.setup();
      const { updateHandler, mockState } = await setupVoting(false, false);

      expect(screen.getByText("たほいや")).toBeInTheDocument();
      expect(screen.getByText("正解の意味")).toBeInTheDocument();

      // 選択して投票
      await user.click(screen.getByText("正解の意味"));
      await user.click(screen.getByRole("button", { name: "投票する" }));

      // 自分が「投票済み」になった状態をシミュレート
      const nextState: VotingState = {
        ...mockState,
        players: [{ id: playerId, name: "自分", score: 0, hasVoted: true }],
      };

      await waitFor(() => {
        updateHandler({ gameState: nextState });
      });

      expect(screen.getByText("投票完了！")).toBeInTheDocument();
    });

    it("親プレイヤーの場合、待機案内が表示される", async () => {
      await setupVoting(false, true);

      expect(screen.getByText("あなたは親です")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "投票する" })).not.toBeInTheDocument();
    });

    it("既に投票済みの場合は待機画面が表示される", async () => {
      await setupVoting(true);

      expect(screen.getByText("投票完了！")).toBeInTheDocument();
    });
  });

  describe("結果発表フェーズ（round_result）", () => {
    const mockResultState = {
      phase: "round_result",
      roomId,
      hostId: "host-id",
      players: [
        { id: "player-1", name: "自分", score: 10 },
        { id: "player-2", name: "相手1", score: 5 },
        { id: "parent-id", name: "親プレイヤー", score: 8 },
      ],
      round: 1,
      parentPlayerId: "parent-id",
      theme: "たほいや",
      meanings: [
        { choiceIndex: 0, text: "正解の意味", authorId: "parent-id" },
        { choiceIndex: 1, text: "嘘の意味1", authorId: "player-1" },
      ],
      votes: [{ voterId: "player-2", choiceIndex: 1, betPoints: 2 }],
    };

    it("結果画面が表示され、正解や投票内容が確認できる", async () => {
      render(<RoomContainer roomId={roomId} playerId={playerId} />);
      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      await waitFor(() => {
        updateHandler({ gameState: mockResultState });
      });

      expect(screen.getByText("たほいや")).toBeInTheDocument();
      expect(screen.getByText("正解の意味")).toBeInTheDocument();
      expect(screen.getByText("正解！")).toBeInTheDocument();
      expect(screen.getByText("嘘の意味1")).toBeInTheDocument();
      expect(screen.getByText("自分 の嘘")).toBeInTheDocument();
      expect(screen.getByText("相手1 (2点)")).toBeInTheDocument();
    });

    it("ホストの場合、次のラウンドへボタンが表示され送信できる", async () => {
      const user = userEvent.setup();
      // 自分がホストの場合
      const hostState = { ...mockResultState, hostId: playerId };

      render(<RoomContainer roomId={roomId} playerId={playerId} />);
      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      await waitFor(() => {
        updateHandler({ gameState: hostState });
      });

      const nextButton = screen.getByRole("button", { name: "次のラウンドへ" });
      await user.click(nextButton);

      expect(mockEmit).toHaveBeenCalledWith("next_round", { roomId });
    });

    it("ホストでない場合、待機メッセージが表示される", async () => {
      render(<RoomContainer roomId={roomId} playerId={playerId} />);
      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      await waitFor(() => {
        updateHandler({ gameState: mockResultState });
      });

      expect(
        screen.getByText(/ホストが次のラウンドを開始するのを待っています/),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "次のラウンドへ" })).not.toBeInTheDocument();
    });
  });

  describe("最終結果フェーズ（final_result）", () => {
    it("最終結果画面が表示され、優勝者が確認できる", async () => {
      render(<RoomContainer roomId={roomId} playerId={playerId} />);
      const updateHandler = (mockOn as Mock).mock.calls.find(
        (call) => call[0] === "update_game_state",
      )?.[1];

      const mockFinalState = {
        phase: "final_result",
        roomId,
        hostId: "host-id",
        players: [
          { id: "player-1", name: "自分", score: 30 },
          { id: "player-2", name: "相手", score: 20 },
        ],
        winnerIds: ["player-1"],
      };

      await waitFor(() => {
        updateHandler({ gameState: mockFinalState });
      });

      expect(screen.getByText("最終結果発表")).toBeInTheDocument();
      // '自分'は優勝者エリアとスコア表、右タブの3箇所に表示される
      expect(screen.getAllByText("自分")).toHaveLength(3);
      expect(screen.getByText("30")).toBeInTheDocument();
      // 優勝者の強調表示（Badgeなど）を確認
      expect(screen.getByText("WINNER")).toBeInTheDocument();
    });
  });
});

// ヘルパー: Storybookのテストユーティリティに似た挙動
function canvasElement() {
  return within(document.body);
}
