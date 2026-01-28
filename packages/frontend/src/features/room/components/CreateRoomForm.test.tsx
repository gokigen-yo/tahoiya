import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CreateRoomForm } from "./CreateRoomForm";

describe("CreateRoomForm", () => {
  it("ユーザーがルーム作成フォームを初めて見たとき、必要な情報が全て表示されている", () => {
    render(<CreateRoomForm onSubmit={vi.fn()} isLoading={false} error={null} />);

    // タイトル、説明文、入力欄、ボタンが全て表示されている
    expect(screen.getByRole("heading", { name: "たほいや" })).toBeInTheDocument();
    expect(screen.getByText("Web版たほいやへようこそ！")).toBeInTheDocument();
    expect(
      screen.getByText("プレイヤー名を入力して、新しいルームを作成してください。"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("プレイヤー名を入力")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ルームを作成" })).toBeInTheDocument();
    // エラーは表示されていない
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ユーザーがプレイヤー名を入力してボタンをクリックすると、ルーム作成処理が実行される", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CreateRoomForm onSubmit={onSubmit} isLoading={false} error={null} />);

    // プレイヤー名を入力
    const input = screen.getByPlaceholderText("プレイヤー名を入力");
    await user.type(input, "テストプレイヤー");

    // ボタンをクリック
    const button = screen.getByRole("button", { name: "ルームを作成" });
    await user.click(button);

    // onSubmitが正しい引数で呼ばれる
    expect(onSubmit).toHaveBeenCalledWith("テストプレイヤー");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ルーム作成処理中は、ユーザーが再度送信できないようフォームが無効化される", () => {
    render(<CreateRoomForm onSubmit={vi.fn()} isLoading={true} error={null} />);

    // 入力フィールドとボタンが無効化されている
    const input = screen.getByPlaceholderText("プレイヤー名を入力");
    const button = screen.getByRole("button");

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("ルーム作成に失敗したとき、ユーザーにエラーメッセージが表示される", () => {
    const errorMessage = "プレイヤー名を入力してください";
    render(<CreateRoomForm onSubmit={vi.fn()} isLoading={false} error={errorMessage} />);

    // エラーメッセージが表示される
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
