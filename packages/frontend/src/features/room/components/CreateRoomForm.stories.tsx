import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { CreateRoomForm } from "./CreateRoomForm";

const meta: Meta<typeof CreateRoomForm> = {
  title: "Features/Room/CreateRoomForm",
  component: CreateRoomForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onSubmit: fn(),
    isLoading: false,
    error: null,
  },
};

export default meta;
type Story = StoryObj<typeof CreateRoomForm>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトル、説明文、入力欄、ボタンが全て表示されている
    await expect(canvas.getByRole("heading", { name: "たほいや" })).toBeInTheDocument();
    await expect(canvas.getByText("Web版たほいやへようこそ！")).toBeInTheDocument();
    await expect(
      canvas.getByText("プレイヤー名を入力して、新しいルームを作成してください。"),
    ).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("プレイヤー名を入力")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "ルームを作成" })).toBeInTheDocument();

    // エラーは表示されていない
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

export const Interaction: Story = {
  args: {},
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // プレイヤー名を入力
    const input = canvas.getByPlaceholderText("プレイヤー名を入力");
    await userEvent.type(input, "テストプレイヤー");

    // ボタンをクリック
    const button = canvas.getByRole("button", { name: "ルームを作成" });
    await userEvent.click(button);

    // onSubmitが正しい引数で呼ばれる
    await expect(args.onSubmit).toHaveBeenCalledWith("テストプレイヤー");
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 入力フィールドとボタンが無効化されている
    const input = canvas.getByPlaceholderText("プレイヤー名を入力");
    const button = canvas.getByRole("button");

    await expect(input).toBeDisabled();
    await expect(button).toBeDisabled();
  },
};

export const WithError: Story = {
  args: {
    error: "プレイヤー名を入力してください",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示される
    await expect(canvas.getByText("プレイヤー名を入力してください")).toBeInTheDocument();
  },
};
