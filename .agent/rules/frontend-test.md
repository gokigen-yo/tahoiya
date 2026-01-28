---
trigger: always_on
---

# Frontend Unit/Integration Test Implementation Guidelines

## Testing Philosophy

フロントエンドの単体テストは、**ユーザー価値に焦点を当てる**ことを最優先とします。実装の詳細ではなく、ユーザーが実際に体験する動作をテストします。

## Core Principles

### One User Story Per Test

各テストは1つの明確なユーザーストーリーを表現します。

**Good ✅**
```typescript
it("ユーザーがプレイヤー名を入力してボタンをクリックすると、ルーム作成処理が実行される", async () => {
  // ユーザーの一連の操作をテスト
});
```

**Bad ❌**
```typescript
describe("フォーム送信", () => {
  it("ボタンが表示される", () => { /* ... */ });
  it("ボタンをクリックできる", () => { /* ... */ });
  it("onSubmitが呼ばれる", () => { /* ... */ });
});
```

### Test User-Facing Behavior Only

実装の詳細ではなく、ユーザーが観察できる動作のみをテストします。

**Good ✅**
```typescript
// ユーザーが見える/操作できること
expect(button).toBeDisabled();
expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
```

**Bad ❌**
```typescript
// 実装の詳細
expect(button).toHaveAttribute("data-loading");
expect(component.state.isSubmitting).toBe(true);
```

## What to Test

### Presentational Components

Presentationalコンポーネントでは以下をテストします:

1. 初期表示: ユーザーが最初に見る画面
2. ユーザー操作: クリック、入力、キーボード操作
3. 状態変化: ローディング、エラー表示
4. 条件分岐: props による表示の変化

Example:
```typescript
describe("CreateRoomForm", () => {
  it("ユーザーがルーム作成フォームを初めて見たとき、必要な情報が全て表示されている", () => {
    render(<CreateRoomForm onSubmit={vi.fn()} isLoading={false} error={null} />);
    
    expect(screen.getByRole("heading", { name: "たほいや" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("プレイヤー名を入力")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ルームを作成" })).toBeInTheDocument();
  });

  it("ユーザーがプレイヤー名を入力してボタンをクリックすると、ルーム作成処理が実行される", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CreateRoomForm onSubmit={onSubmit} isLoading={false} error={null} />);

    await user.type(screen.getByPlaceholderText("プレイヤー名を入力"), "テストプレイヤー");
    await user.click(screen.getByRole("button", { name: "ルームを作成" }));

    expect(onSubmit).toHaveBeenCalledWith("テストプレイヤー");
  });
});
```

### Container Components

Containersコンポーネントは、インテグレーションテストとして実装します。

1. インテグレーションテスト: 内部で使用しているカスタムフック自体をモックするのではなく、フックが呼び出す外部依存（API、Socket、localStorage等）のみをモックします。
2. 副作用の検証: ユーザー操作の結果として発生する副作用（データの読み込み、Socket送信、ナビゲーション、永続ストレージへの保存）を検証します。

**Example (Socket.IO & localStorage):**
```typescript
it("ルーム作成に成功すると、ゲーム画面に遷移する", async () => {
  const user = userEvent.setup();
  render(<CreateRoomContainer />);

  // フォーム送信
  await user.type(screen.getByPlaceholderText("プレイヤー名を入力"), "テストプレイヤー");
  await user.click(screen.getByRole("button", { name: "ルームを作成" }));

  // Socket応答のシミュレーション（外部依存のモック操作）
  const roomCreatedCallback = (mockOnce as Mock).mock.calls.find(call => call[0] === "room_created")?.[1];
  await waitFor(() => {
    roomCreatedCallback({ roomId: "test-room", playerId: "test-player" });
  });

  // 遷移先の画面の検証
  expect(screen.getByRole("button", { name: "ゲームを開始" })).toBeInTheDocument();
});
```

### Custom Hooks

カスタムフックは、基本的にはコンポーネントのテスト経由でテストします。
ただし、フックの実装が複雑な場合は単体テストを用意します。

あくまでユーザーの画面がどのようにテストするかを検証してください。

## What NOT to Test

以下はテストしません:

- 純粋関数としての性質（冪等性）
- 内部状態の有無
- CSS クラス名や data 属性
- コンポーネントのレンダリング回数
- 実装の詳細（useState, useEffect の呼び出し等）

## Query Priority

要素を取得する際の優先順位:

1. `getByRole`: アクセシビリティを考慮した最優先の方法
2. `getByLabelText`: フォーム要素
3. `getByPlaceholderText`: 入力フィールド
4. `getByText`: テキストコンテンツ
5. `getByTestId`: 最終手段（できるだけ避ける）

## File Naming and Location

テストファイルは、テスト対象のファイルと同じディレクトリに配置します。

```
src/features/room/components/
├── CreateRoomForm.tsx
└── CreateRoomForm.test.tsx
```

## References

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)