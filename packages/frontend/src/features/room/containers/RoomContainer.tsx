"use client";

import { Box, Center, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { RoomStateResponse } from "@/features/room/types/RoomStateResponse";
import { getSocket } from "@/lib/socket";
import { WaitingRoomView } from "../components/WaitingRoomView";

type RoomContainerProps = {
  roomId: string;
  playerId: string;
  initialGameState?: RoomStateResponse;
};

export function RoomContainer({ roomId, playerId, initialGameState }: RoomContainerProps) {
  const [gameState, setGameState] = useState<RoomStateResponse | null>(initialGameState || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    // ゲーム状態の更新を受け取る
    const handleUpdateGameState = (data: { gameState: RoomStateResponse }) => {
      console.log("update_game_state", data);
      setGameState(data.gameState);
    };

    socket.on("update_game_state", handleUpdateGameState);

    return () => {
      socket.off("update_game_state", handleUpdateGameState);
    };
  }, []);

  const handleStartGame = () => {
    setIsLoading(true);
    const socket = getSocket();

    // start_game に対するエラーハンドリングなどは簡易的に行う
    // 成功すれば update_game_state が飛んでくるはず
    socket.emit("start_game", { roomId });

    // タイムアウト的な処理は省略（状態更新でローディング解除）
    // 厳密にはエラーイベントもリッスンすべき
    socket.once("error", () => setIsLoading(false));
  };

  // 状態ごとのレンダリング
  if (!gameState) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
        <Text ml={4}>ルーム情報を取得中...</Text>
      </Center>
    );
  }

  // 待機画面
  if (gameState.phase === "waiting_for_join") {
    return (
      <WaitingRoomView
        roomId={roomId}
        players={gameState.players}
        isHost={gameState.hostId === playerId}
        onStartGame={handleStartGame}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Box p={4}>
      <Text>Game Phase: {gameState.phase}</Text>
      {/* TODO: 他のフェーズのコンポーネントをここに実装していく */}
    </Box>
  );
}
