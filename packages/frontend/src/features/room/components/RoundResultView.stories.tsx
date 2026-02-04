import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "@storybook/test";
import { RoundResultView } from "./RoundResultView";

const meta: Meta<typeof RoundResultView> = {
  title: "Features/Room/RoundResultView",
  component: RoundResultView,
  args: {
    theme: "たほいや",
    players: [
      { id: "p1", name: "ホスト親", score: 10 },
      { id: "p2", name: "子プレイヤー1", score: 5 },
      { id: "p3", name: "子プレイヤー2", score: 8 },
    ],
    parentPlayerId: "p1",
    meanings: [
      { choiceIndex: 0, text: "江戸時代の髪型の一種", authorId: "p1" },
      { choiceIndex: 1, text: "冬に咲く珍しい花", authorId: "p2" },
      { choiceIndex: 2, text: "古い漁具の名称", authorId: "p3" },
    ],
    votes: [
      { voterId: "p2", choiceIndex: 1, betPoints: 2 },
      { voterId: "p3", choiceIndex: 0, betPoints: 3 },
    ],
    isHost: true,
    onNextRound: fn(),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof RoundResultView>;

export const Default: Story = {
  name: "基本表示 (ホスト視点)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("結果発表 - お題")).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "たほいや" })).toBeInTheDocument();

    const correctMeaningBox = canvas.getByText("江戸時代の髪型の一種").closest("div")!;
    await expect(within(correctMeaningBox).getByText("正解！")).toBeInTheDocument();

    const wrongMeaningBox = canvas.getByText("冬に咲く珍しい花").closest("div")!;
    await expect(within(wrongMeaningBox).getByText("子プレイヤー1 の嘘")).toBeInTheDocument();

    await expect(canvas.getByText(/子プレイヤー2.*3点/)).toBeInTheDocument();

    await expect(canvas.getByText("ホスト親")).toBeInTheDocument();
    await expect(canvas.getByText("10")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "次のラウンドへ" })).toBeInTheDocument();
  },
};

export const PlayerView: Story = {
  name: "プレイヤー視点 (待機中)",
  args: {
    isHost: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("ホストが次のラウンドを開始するのを待っています..."),
    ).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const AllFooled: Story = {
  name: "全員が嘘に騙された場合",
  args: {
    votes: [
      { voterId: "p2", choiceIndex: 2, betPoints: 3 },
      { voterId: "p3", choiceIndex: 1, betPoints: 2 },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("江戸時代の髪型の一種")).toBeInTheDocument();
    await expect(canvas.getByText("投票なし")).toBeInTheDocument();

    await expect(canvas.getByText(/子プレイヤー2.*2点/)).toBeInTheDocument();
    await expect(canvas.getByText(/子プレイヤー1.*3点/)).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: "ローディング中",
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await expect(button).toHaveAttribute("data-loading");
  },
};
