import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { VotingView } from "./VotingView";

const meta: Meta<typeof VotingView> = {
  title: "Features/Room/VotingView",
  component: VotingView,
  args: {
    theme: "たほいや",
    meanings: [
      { choiceIndex: 0, text: "イノシシを追うための小屋" },
      { choiceIndex: 1, text: "江戸時代の髪型の一種" },
      { choiceIndex: 2, text: "冬に咲く珍しい花" },
    ],
    isParent: false,
    hasVoted: false,
    onSubmit: fn(),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof VotingView>;

export const ChildInput: Story = {
  name: "子プレイヤー: 投票フォーム",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText("たほいや")).toBeInTheDocument();
    expect(canvas.getByText("イノシシを追うための小屋")).toBeInTheDocument();
    expect(canvas.getByText("江戸時代の髪型の一種")).toBeInTheDocument();

    const submitButton = canvas.getByRole("button", { name: "投票する" });
    await expect(submitButton).toBeDisabled();

    const choice = canvas.getByText("イノシシを追うための小屋");
    await userEvent.click(choice);

    await expect(submitButton).toBeEnabled();

    const betInput = canvas.getByLabelText("賭け点");
    await userEvent.clear(betInput);
    await userEvent.type(betInput, "3");

    await userEvent.click(submitButton);

    expect(args.onSubmit).toHaveBeenCalledWith(0, 3);
  },
};

export const ChildVoted: Story = {
  name: "子プレイヤー: 投票済み",
  args: {
    hasVoted: true,
    selectedChoiceIndex: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("投票完了！")).toBeInTheDocument();
    expect(canvas.getByText("(あなたの選択)")).toBeInTheDocument();
    expect(canvas.getByText("江戸時代の髪型の一種")).toBeInTheDocument();
    expect(canvas.queryByRole("button", { name: /投票する/i })).not.toBeInTheDocument();
  },
};

export const ParentWaiting: Story = {
  name: "親プレイヤー: 待機画面",
  args: {
    isParent: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("あなたは親です")).toBeInTheDocument();
    expect(canvas.getByText("提示されている意味の一覧:")).toBeInTheDocument();
    expect(canvas.getByText("冬に咲く珍しい花")).toBeInTheDocument();
    expect(canvas.queryByRole("button", { name: /投票する/i })).not.toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: "ローディング中",
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    const submitButton = buttons.find(
      (b) => b.hasAttribute("data-loading") || b.textContent?.includes("投票する"),
    );
    expect(submitButton).toBeDefined();
    expect(submitButton).toBeDisabled();
  },
};
