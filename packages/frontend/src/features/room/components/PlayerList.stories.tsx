import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { PlayerList } from "./PlayerList";

const meta: Meta<typeof PlayerList> = {
  title: "Features/Room/PlayerList",
  component: PlayerList,
  args: {
    players: [
      { id: "1", name: "プレイヤー1", score: 100 },
      { id: "2", name: "プレイヤー2", score: 80 },
      { id: "3", name: "プレイヤー3", score: 120 },
      { id: "4", name: "プレイヤー4", score: 90 },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof PlayerList>;

export const Default: Story = {
  name: "ユーザーがプレイヤー一覧を見たとき、全てのプレイヤーの名前と点数が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // プレイヤー名が表示されていることを確認
    await expect(canvas.getByText("プレイヤー1")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー2")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー3")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー4")).toBeInTheDocument();

    // 点数が表示されていることを確認
    await expect(canvas.getByText("100点")).toBeInTheDocument();
    await expect(canvas.getByText("80点")).toBeInTheDocument();
    await expect(canvas.getByText("120点")).toBeInTheDocument();
    await expect(canvas.getByText("90点")).toBeInTheDocument();
  },
};

export const WithHighlightedPlayer: Story = {
  name: "親プレイヤーが存在するとき、親プレイヤーが強調表示される",
  args: {
    parentPlayerId: "2",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 親プレイヤーに「(親)」が表示されていることを確認
    await expect(canvas.getByText("プレイヤー2 (親)")).toBeInTheDocument();

    // 他のプレイヤーには「(親)」が表示されていないことを確認
    await expect(canvas.queryByText("プレイヤー1 (親)")).not.toBeInTheDocument();
    await expect(canvas.queryByText("プレイヤー3 (親)")).not.toBeInTheDocument();
  },
};

export const WithCurrentPlayer: Story = {
  name: "現在のプレイヤーが指定されているとき、そのプレイヤーが視覚的に区別される",
  args: {
    currentPlayerId: "3",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全てのプレイヤーが表示されていることを確認
    await expect(canvas.getByText("プレイヤー1")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー2")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー3")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー4")).toBeInTheDocument();
  },
};

export const WithBothHighlights: Story = {
  name: "親プレイヤーと現在のプレイヤーが両方指定されているとき、両方が適切に表示される",
  args: {
    currentPlayerId: "1",
    parentPlayerId: "2",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 親プレイヤーに「(親)」が表示されていることを確認
    await expect(canvas.getByText("プレイヤー2 (親)")).toBeInTheDocument();

    // 全てのプレイヤーが表示されていることを確認
    await expect(canvas.getByText("プレイヤー1")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー3")).toBeInTheDocument();
    await expect(canvas.getByText("プレイヤー4")).toBeInTheDocument();
  },
};
