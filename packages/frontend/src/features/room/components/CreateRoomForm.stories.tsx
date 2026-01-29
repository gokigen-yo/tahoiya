import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
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
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    error: "ルーム作成中にエラーが発生しました。もう一度お試しください。",
  },
};
