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

    // 入力と送信
    const input = canvas.getByPlaceholderText("お題（単語）を入力");
    await userEvent.type(input, "たほいや");

    const submitButton = canvas.getByRole("button", { name: "決定" });
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
    // loading 中はテキストが隠れるか、DOM構造が変わる可能性があるため単純に button ロールで取得
    const submitButton = canvas.getByRole("button");
    expect(submitButton).toBeDisabled();
  },
};
