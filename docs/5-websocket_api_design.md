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
| `room_created` | ルーム作成成功時に、作成者本人に通知 | `{ roomId: string, playerId: string, gameState: RoomStateResponse }` ※`playerId`をここで通知 | 作成者のみ |
| `join_success` | ルーム参加成功時に、参加者本人に通知 | `{ roomId: string, playerId: string }` | 参加者のみ |
| `update_game_state` | ゲームの状態が更新されたことを通知 | `{ gameState: RoomStateResponse }` | ルーム全員 |
| `error` | 何らかのエラーが発生したことを通知 | `{ message: string }` | 操作した人のみ |

### 6.1. RoomStateResponse (JSON Structure)

サーバーからクライアントに配信されるゲーム状態は、フェーズごとに定義された構造を持つ。
他人の回答内容や匿名投票の正体など、ゲームの公平性を損なう情報はサーバー側で隠蔽（フィルタリング）された状態で配信される。

#### 1. 待機中 (waiting_for_join)

```json
{
  "phase": "waiting_for_join",
  "roomId": "string",
  "hostId": "string",
  "players": [
    {
      "id": "string",
      "name": "string",
      "score": 0
    }
  ]
}
```

#### 2. お題入力中 (theme_input)

```json
{
  "phase": "theme_input",
  "roomId": "string",
  "hostId": "string",
  "players": [
    {
      "id": "string",
      "name": "string",
      "score": 0
    }
  ],
  "round": 1,
  "parentPlayerId": "string"
}
```

#### 3. 意味入力中 (meaning_input)

* `hasSubmitted` はそのプレイヤーが既に意味を入力したかを示す。自身の入力内容以外はこのフラグで進捗を確認する。

```json
{
  "phase": "meaning_input",
  "roomId": "string",
  "hostId": "string",
  "players": [
    {
      "id": "string",
      "name": "string",
      "score": 0,
      "hasSubmitted": true
    }
  ],
  "round": 1,
  "parentPlayerId": "string",
  "theme": "string"
}
```

#### 4. 投票中 (voting)

* `meanings` は送信されるが、`authorId` (誰が書いたか) は削除され、順序はシャッフルされている。
* `hasVoted` はそのプレイヤーが既に投票したかを示す。

```json
{
  "phase": "voting",
  "roomId": "string",
  "hostId": "string",
  "players": [
    {
      "id": "string",
      "name": "string",
      "score": 0,
      "hasVoted": true
    }
  ],
  "round": 1,
  "parentPlayerId": "string",
  "theme": "string",
  "meanings": [
    {
      "choiceIndex": 0,
      "text": "string"
    }
  ]
}
```

#### 5. 結果発表 (round_result)

* すべての情報（誰がどの意味を書いたか、誰がどこに投票したか）が開示される。

```json
{
  "phase": "round_result",
  "roomId": "string",
  "hostId": "string",
  "players": [
    {
      "id": "string",
      "name": "string",
      "score": 0
    }
  ],
  "round": 1,
  "parentPlayerId": "string",
  "theme": "string",
  "meanings": [
    {
      "choiceIndex": 0,
      "text": "string",
      "authorId": "string"
    }
  ],
  "votes": [
    {
      "voterId": "string",
      "choiceIndex": 0,
      "betPoints": 1
    }
  ]
}
```

#### 6. 最終結果 (final_result)

```json
{
  "phase": "final_result",
  "roomId": "string",
  "hostId": "string",
  "players": [
    {
      "id": "string",
      "name": "string",
      "score": 10
    }
  ],
  "winnerIds": ["string"]
}
```
