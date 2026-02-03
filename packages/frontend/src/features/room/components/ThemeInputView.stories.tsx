import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { ThemeInputView } from "./ThemeInputView";

const meta: Meta<typeof ThemeInputView> = {
  title: "Features/Room/ThemeInputView",
  component: ThemeInputView,
  args: {
    round: 1,
    isParent: false,
    parentName: "親プレイヤー",
    onSubmit: fn(),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof ThemeInputView>;

export const ParentView: Story = {
  name: "親プレイヤー: お題入力フォームが表示される",
  args: {
    isParent: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // テキストの確認
    expect(canvas.getByText("第1ラウンド")).toBeInTheDocument();
    expect(canvas.getByText(/あなたは親です/)).toBeInTheDocument();

    const submitButton = canvas.getByRole("button", { name: "決定" });
    await expect(submitButton).toBeDisabled(); // 初期は空なので無効

    // 入力
    const input = canvas.getByPlaceholderText("お題（単語）を入力");
    await userEvent.type(input, "たほいや");

    await expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    await expect(args.onSubmit).toHaveBeenCalledWith("たほいや");
  },
};

export const ChildView: Story = {
  name: "子プレイヤー: 待機メッセージが表示される",
  args: {
    isParent: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // テキストの確認
    expect(canvas.getByText("第1ラウンド")).toBeInTheDocument();
    expect(canvas.getByText(/親（親プレイヤー）がお題を考えています/)).toBeInTheDocument();
    expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: "送信中: ボタンが無効化される",
  args: {
    isParent: true,
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole("button");
    // loading 中のテキストはコンポーネント実装に依存するため要素自体で確認
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute("data-loading");
  },
};
