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

プレゼンテーショナルコンポーネントでは以下をテストします:

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

コンテナコンポーネントでは、モックを使用してビジネスロジックをテストします（今後実装予定）。

### Custom Hooks

カスタムフックは、実際の使用シナリオに基づいてテストします（今後実装予定）。

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