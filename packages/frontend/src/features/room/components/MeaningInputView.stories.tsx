import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { MeaningInputView } from "./MeaningInputView";

const meta: Meta<typeof MeaningInputView> = {
  title: "Features/Room/MeaningInputView",
  component: MeaningInputView,
  args: {
    theme: "たほいや",
    isParent: false,
    hasSubmitted: false,
    onSubmit: fn(),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof MeaningInputView>;

export const ParentInput: Story = {
  name: "親プレイヤー: 正解入力フォーム",
  args: {
    isParent: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByRole("heading", { name: "たほいや" })).toBeInTheDocument();
    expect(canvas.getByText(/正しい意味/)).toBeInTheDocument();

    const textarea = canvas.getByRole("textbox");
    await userEvent.type(textarea, "イノシシを追うための小屋");

    const submitButton = canvas.getByRole("button", { name: "決定" });
    await expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    await expect(args.onSubmit).toHaveBeenCalledWith("イノシシを追うための小屋");
  },
};

export const ChildInput: Story = {
  name: "子プレイヤー: 嘘入力フォーム",
  args: {
    isParent: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText(/嘘の意味/)).toBeInTheDocument();
    const textarea = canvas.getByPlaceholderText("もっともらしい嘘の意味を入力");
    await expect(textarea).toBeInTheDocument();
  },
};

export const Submitted: Story = {
  name: "送信済み: 待機メッセージ",
  args: {
    hasSubmitted: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText("送信しました！")).toBeInTheDocument();
    expect(canvas.getByText(/他のプレイヤーの入力待ちです/)).toBeInTheDocument();
    expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
  },
};
