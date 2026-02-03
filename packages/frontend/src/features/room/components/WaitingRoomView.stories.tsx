import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { WaitingRoomView } from "./WaitingRoomView";

const meta: Meta<typeof WaitingRoomView> = {
  title: "Features/Room/WaitingRoomView",
  component: WaitingRoomView,
  args: {
    roomId: "test-room-id",
    players: [
      { id: "1", name: "プレイヤー1" },
      { id: "2", name: "プレイヤー2" },
      { id: "3", name: "プレイヤー3" },
      { id: "4", name: "プレイヤー4" },
    ],
    isHost: false,
    onStartGame: fn(),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof WaitingRoomView>;

export const HostView: Story = {
  name: "ホストにはゲーム開始ボタンが表示される",
  args: {
    isHost: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/待機ルーム/)).toBeInTheDocument();
    expect(canvas.getByText(/test-room-id/)).toBeInTheDocument();

    // プレイヤーリストの確認
    expect(canvas.getByText(/プレイヤー1/)).toBeInTheDocument();
    expect(canvas.getByText(/プレイヤー4/)).toBeInTheDocument();

    const startButton = canvas.getByRole("button", { name: /ゲームを開始する/ });
    await expect(startButton).toBeInTheDocument();
    await expect(startButton).toBeEnabled();
    await userEvent.click(startButton);
    await expect(args.onStartGame).toHaveBeenCalled();
  },
};

export const GuestView: Story = {
  name: "ゲストには待機メッセージが表示される",
  args: {
    isHost: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: /ゲームを開始する/ }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByText(/ホストがゲームを開始するのを待っています.../),
    ).toBeInTheDocument();

    // プレイヤーリストが正しく表示されているか
    expect(canvas.getByText(/プレイヤー2/)).toBeInTheDocument();
  },
};

export const NotEnoughPlayers: Story = {
  name: "プレイヤーが足りない場合、開始ボタンは無効化される",
  args: {
    isHost: true,
    players: [{ id: "1", name: "プレイヤー1" }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startButton = canvas.getByRole("button", { name: /ゲームを開始する/ });
    await expect(startButton).toBeDisabled();
    // 3人必要なので、1人しかいない場合はあと2人必要
    await expect(canvas.getByText(/あと.*2.*人必要です/)).toBeInTheDocument();
  },
};

export const TwoPlayers: Story = {
  name: "2人の場合でも、開始ボタンは無効化される",
  args: {
    isHost: true,
    players: [
      { id: "1", name: "プレイヤー1" },
      { id: "2", name: "プレイヤー2" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startButton = canvas.getByRole("button", { name: /ゲームを開始する/ });
    await expect(startButton).toBeDisabled();
    await expect(canvas.getByText(/あと.*1.*人必要です/)).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: "開始処理中はローディング表示になる",
  args: {
    isHost: true,
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    const startButton = buttons.find(
      (b) => b.hasAttribute("data-loading") || b.textContent?.includes("開始中"),
    );
    await expect(startButton).toBeDefined();
    await expect(startButton).toBeDisabled();
  },
};
