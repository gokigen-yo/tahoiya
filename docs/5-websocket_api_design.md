# WebSocket API 設計仕様書

## 1. 概要

本ドキュメントは、「たほいや」Webアプリケーションにおけるクライアントとサーバー間のリアルタイム通信プロトコルを定義する。
通信には **Socket.IO** ライブラリを使用し、これにより双方向のイベントベース通信を実現する。

## 2. 通信の基本原則

-   **接続**: クライアントはサーバーに接続後、アプリケーションを閉じるまで単一のコネクションを維持する。
-   **通信形式**: 通信は、HTTPリクエスト（POST/GET）ではなく、定義された「イベント」を `emit` (送信) / `on` (受信) することで行われる。
-   **配信制御**: サーバーは、メッセージの送信対象を以下のように柔軟に制御する。
    -   **全員へ送信 (Broadcast)**: ルームに参加している全プレイヤーに通知。（例: ゲーム状態の更新）
    -   **特定プレイヤーへ送信**: 操作を行った本人にのみ返信。（例: エラー通知）
    -   **送信者以外へ送信**: 操作を行った本人以外の全員に通知。（例: 「〇〇さんが参加しました」）

## 3. プレイヤーの復帰とID管理

ブラウザのリロードやネットワークの瞬断に対応し、プレイヤーがゲームに復帰できる仕組みを実装する。

-   **`socket.id` (一時ID)**: Socket.IOが接続ごとに発行するID。接続が切れると変わり、復帰のキーには**使用しない**。サーバーは、各プレイヤーの現在の一時IDを常に把握しておく。
-   **`playerId` (永続ID)**: プレイヤーを永続的に識別するためのID。初回参加時にサーバーが発行し、クライアントはこれを `localStorage` に保存する。

### 復帰フロー

1.  **初回参加**: サーバーが `playerId` を発行し、クライアントに通知。クライアントはこれを `localStorage` に保存する。
2.  **再接続**: クライアントは `localStorage` から `playerId` を読み出し、参加イベントに含めてサーバーに送信する。
3.  **サーバーの処理**: サーバーは `playerId` を元にプレイヤーを特定し、新しい `socket.id` をプレイヤー情報に紐づけて更新することで、ゲームへの復帰を許可する。

## 4. 認証とアクションの実行者特定
なりすましを防ぐため、アクションの実行者は以下の原則に基づいてサーバー側で厳格に特定する。

- **実行者の特定**: サーバーは、クライアントからイベントを受信する際、メッセージの送信元である`socket.id`をキーとして、内部で管理する「`playerId`と`socket.id`の対応表」を逆引きする。これにより、アクションを実行した真の`playerId`を特定する。
- **クライアントからの申告の不採用**: クライアントがペイロードに`playerId`を含めて送信してきた場合でも、サーバーはその値を**信用せず、無視する**。アクションの実行主は、常にサーバーが`socket.id`から特定した`playerId`とする。

## 5. イベント一覧

### 5.1. クライアント → サーバー (C→S)

ユーザーのアクションによって発生するイベント。

| イベント名 | 説明 | 送信するデータ（ペイロード） |
| :--- | :--- | :--- |
| `create_room` | 新しいルームを作成する | `{ playerName: string }` |
| `join_room` | 既存のルームに参加する | `{ roomId: string, playerName: string, playerId?: string }` ※復帰時は`playerId`を付与 |
| `start_game` | ホストがゲームを開始する | `{ roomId: string }` |
| `submit_theme` | 親がお題を提出する | `{ roomId: string, theme: string, meaning: string, refUrl?: string }` |
| `submit_meaning`| 「意味」を提出する | `{ roomId: string, meaning: string }` |
| `submit_vote` | 子が投票する | `{ roomId: string, choiceIndex: number, betPoints: number }` |
| `next_round` | 次のラウンドへ進む | `{ roomId: string }` |
| `back_to_top` | ゲーム終了後、トップに戻る | `{ roomId: string }` |

### 5.2. サーバー → クライアント (S→C)

サーバー側での処理結果や状態変更を通知するイベント。

| イベント名 | 説明 | 受信するデータ（ペイロード） | 配信対象 |
| :--- | :--- | :--- | :--- |
| `room_created` | ルーム作成成功時に、作成者本人に通知 | `{ roomId: string, playerId: string, gameState: GameState }` ※`playerId`をここで通知 | 作成者のみ |
| `join_success` | ルーム参加成功時に、参加者本人に通知 | `{ roomId: string, playerId: string }` | 参加者のみ |
| `update_game_state` | ゲームの状態が更新されたことを通知 | `{ gameState: GameState }` | ルーム全員 |
| `error` | 何らかのエラーが発生したことを通知 | `{ message: string }` | 操作した人のみ |

## 6. 主要データ構造

### 6.1. GameState

サーバーが管理し、クライアントに同期されるゲーム全体の状態を表すオブジェクト。
**注意:** 以下の定義はクライアントに送信されるデータのものであり、サーバー内部で管理する`socket.id`は含まない。

```typescript
type GameState = {
  // ルーム情報
  roomId: string;
  phase: 'waiting' | 'theme_input' | 'meaning_input' | 'voting' | 'result' | 'final_result';
  round: number;

  // プレイヤー情報
  players: {
    id: string; // 永続的なplayerId
    name: string;
    score: number;
    // フェーズごとの状態
    hasSubmittedMeaning?: boolean;
    hasVoted?: boolean;
  }[];
  hostId: string; // ホストの永続playerId
  parentPlayerId: string; // 親の永続playerId

  // ラウンドごとの情報
  theme?: string; // 現在のお題
  choices?: {
    text: string;
    authorId: string; // 偽の意味を書いた人の永続playerId or 'parent'
  }[];
  votes?: {
    playerId: string; // 投票した人の永続playerId
    choiceIndex: number;
    betPoints: number;
  }[];
  roundResult?: any; // ラウンド結果の詳細（点数移動など）
};
```
