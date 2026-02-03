import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { JoinRoomForm } from "./JoinRoomForm";

const meta: Meta<typeof JoinRoomForm> = {
  title: "Features/Room/JoinRoomForm",
  component: JoinRoomForm,
  args: {
    onSubmit: fn(),
    isLoading: false,
    error: null,
  },
};

export default meta;
type Story = StoryObj<typeof JoinRoomForm>;

export const Default: Story = {
  name: "ユーザーがルーム参加フォームを初めて見たとき、必要な情報が全て表示されている",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "ルームに参加" })).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("プレイヤー名を入力")).toBeInTheDocument();
    const submitButton = canvas.getByRole("button", { name: "ルームに参加" });
    await expect(submitButton).toBeDisabled();
  },
};

export const Interaction: Story = {
  name: "ユーザーがプレイヤー名を入力してボタンをクリックすると、ルーム参加処理が実行される",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("プレイヤー名を入力");
    await userEvent.type(input, "参加プレイヤー");

    const submitButton = canvas.getByRole("button", { name: "ルームに参加" });
    await expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    await expect(args.onSubmit).toHaveBeenCalledWith("参加プレイヤー");
  },
};

export const Loading: Story = {
  name: "ロード中、ボタンが無効化される",
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    const submitButton = buttons.find(
      (b) => b.hasAttribute("data-loading") || b.textContent?.includes("参加中"),
    );
    await expect(submitButton).toBeDefined();
    await expect(submitButton).toBeDisabled();
  },
};

export const WithError: Story = {
  name: "エラーがある場合、エラーメッセージが表示される",
  args: {
    error: "ルームが見つかりません",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ルームが見つかりません")).toBeInTheDocument();
    const input = canvas.getByPlaceholderText("プレイヤー名を入力");
    await expect(input).toBeInTheDocument();
  },
};
