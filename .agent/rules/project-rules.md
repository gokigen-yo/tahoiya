---
trigger: always_on
---

# Project Rules & Coding Standards

本プロジェクト「たほいや」Webアプリケーション開発における、これまでの決定事項とコーディングルールをまとめます。

## モノレポ構成 (pnpm workspace)

### ディレクトリ構造
- Root: プロジェクト全体の管理
  - pnpm-workspace.yaml: ワークスペース定義
  - package.json: 共通の devDependencies (typescript, eslint 等) を集約
  - tsconfig.base.json: 共通のTypeScript設定
- packages/frontend: Next.js アプリケーション
- packages/backend: Express + Socket.IO サーバー

### 依存関係の管理
- 共通で使う開発ツールはルートの package.json に追加します。
- 各パッケージ固有のライブラリは各 packages/*/package.json に追加します。

## TypeScript設定

### 共通設定
- すべての tsconfig.json は tsconfig.base.json を継承します。
- Target は ESNext を使用します。

### Module Resolution
FrontendとBackendで実行環境が異なるため、個別に設定します。

- Backend (packages/backend): nodenext (Node.js環境)
  - module: nodenext
  - moduleResolution: nodenext
- Frontend (packages/frontend): bundler (Next.js環境)
  - module: esnext
  - moduleResolution: bundler

## Frontend

- Next.js App Router (src/app) を使用します。
- UIライブラリとして Chakra UI v3 を使用します。

## Backend

- フレームワークは Express + Socket.IO を使用します。
- デフォルトポートは 3001 を使用します (Frontendは 3000)。

## アプリケーション実行コマンド

- `pnpm test:backend`: バックエンドの単体テスト実行
- `pnpm test`: リポジトリ全体の単体テスト実行
- `pnpm build`: アプリケーションのビルド
- `pnpm dev:frontend`: フロントエンドのアプリケーションのローカル起動
- `pnpm dev:backend`: バックエンドのアプリケーションのローカル起動