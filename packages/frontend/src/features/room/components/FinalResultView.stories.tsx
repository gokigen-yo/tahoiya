import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { FinalResultView } from "./FinalResultView";

const meta: Meta<typeof FinalResultView> = {
  title: "Features/Room/FinalResultView",
  component: FinalResultView,
  args: {
    players: [
      { id: "p1", name: "プレイヤー1", score: 25 },
      { id: "p2", name: "プレイヤー2", score: 18 },
      { id: "p3", name: "プレイヤー3", score: 30 },
    ],
    winnerIds: ["p3"],
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof FinalResultView>;

export const SingleWinner: Story = {
  name: "単独優勝",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("最終結果発表")).toBeInTheDocument();
    await expect(canvas.getByText("🏆 優勝 🏆")).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "プレイヤー3" })).toBeInTheDocument();

    // ランキングの確認
    await expect(canvas.getByText("1位")).toBeInTheDocument();
    await expect(canvas.getByText("2位")).toBeInTheDocument();
    await expect(canvas.getByText("3位")).toBeInTheDocument();

    // スコアの確認
    await expect(canvas.getByText("30")).toBeInTheDocument();
    await expect(canvas.getByText("25")).toBeInTheDocument();
    await expect(canvas.getByText("18")).toBeInTheDocument();
  },
};

export const TieWinners: Story = {
  name: "同時優勝",
  args: {
    players: [
      { id: "p1", name: "プレイヤー1", score: 25 },
      { id: "p2", name: "プレイヤー2", score: 25 },
      { id: "p3", name: "プレイヤー3", score: 10 },
    ],
    winnerIds: ["p1", "p2"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "プレイヤー1" })).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "プレイヤー2" })).toBeInTheDocument();

    const winnerBadges = canvas.getAllByText("WINNER");
    await expect(winnerBadges).toHaveLength(2);
  },
};
