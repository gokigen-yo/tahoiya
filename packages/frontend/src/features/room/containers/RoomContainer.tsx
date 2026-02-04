"use client";

import { Box, Heading, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { RoomStateResponse } from "@/features/room/types/RoomStateResponse";
import { getSocket } from "@/lib/socket";
import { FinalResultView } from "../components/FinalResultView";
import { MeaningInputView } from "../components/MeaningInputView";
import { RoundResultView } from "../components/RoundResultView";
import { ThemeInputView } from "../components/ThemeInputView";
import { VotingView } from "../components/VotingView";
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

    socket.on("update_game_state", (data: { gameState: RoomStateResponse }) => {
      console.log("update_game_state", data);
      setGameState(data.gameState);
      setIsLoading(false);
    });

    return () => {
      socket.off("update_game_state");
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

  const handleSubmitTheme = (theme: string) => {
    setIsLoading(true);
    const socket = getSocket();
    socket.emit("submit_theme", { roomId, theme });
    // ローディング解除は update_game_state を受け取った時、あるいは別途制御
    // ここでは簡易的に、フェーズが変わればコンポーネントごとかわるのでそのままで良いが
    // エラーハンドリングなどを厳密にやるなら socket.once('error') などが必要
    setTimeout(() => setIsLoading(false), 2000); // タイムアウトだけつけておく（実際はイベントで遷移）
  };

  const handleSubmitMeaning = (meaning: string) => {
    setIsLoading(true);
    const socket = getSocket();
    socket.emit("submit_meaning", { roomId, meaning });
  };

  const handleSubmitVote = (choiceIndex: number, betPoints: number) => {
    setIsLoading(true);
    const socket = getSocket();
    socket.emit("submit_vote", { roomId, choiceIndex, betPoints });
  };

  const handleNextRound = () => {
    setIsLoading(true);
    const socket = getSocket();
    socket.emit("next_round", { roomId });
  };

  // 状態ごとのレンダリング
  if (!gameState) {
    return <Heading>ルーム情報を取得中...</Heading>;
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

  if (gameState.phase === "theme_input") {
    const parentPlayer = gameState.players.find((p) => p.id === gameState.parentPlayerId);
    return (
      <ThemeInputView
        round={gameState.round}
        isParent={gameState.parentPlayerId === playerId}
        parentName={parentPlayer?.name || "不明なプレイヤー"}
        onSubmit={handleSubmitTheme}
        isLoading={isLoading}
      />
    );
  }

  if (gameState.phase === "meaning_input") {
    const me = gameState.players.find((p) => p.id === playerId);
    return (
      <MeaningInputView
        theme={gameState.theme}
        isParent={gameState.parentPlayerId === playerId}
        hasSubmitted={!!me?.hasSubmitted}
        onSubmit={handleSubmitMeaning}
        isLoading={isLoading}
      />
    );
  }

  if (gameState.phase === "voting") {
    const me = gameState.players.find((p) => p.id === playerId);
    return (
      <VotingView
        theme={gameState.theme}
        meanings={gameState.meanings}
        isParent={gameState.parentPlayerId === playerId}
        hasVoted={!!me?.hasVoted}
        onSubmit={handleSubmitVote}
        isLoading={isLoading}
      />
    );
  }

  if (gameState.phase === "round_result") {
    return (
      <RoundResultView
        theme={gameState.theme}
        meanings={gameState.meanings}
        votes={gameState.votes}
        players={gameState.players}
        parentPlayerId={gameState.parentPlayerId}
        isHost={gameState.hostId === playerId}
        onNextRound={handleNextRound}
        isLoading={isLoading}
      />
    );
  }

  if (gameState.phase === "final_result") {
    return <FinalResultView players={gameState.players} winnerIds={gameState.winnerIds} />;
  }

  return (
    <Box p={4}>
      <Text>Finalizing Game...</Text>
    </Box>
  );
}
