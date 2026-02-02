"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlayerId } from "@/features/room/hooks/usePlayerId";
import type { RoomStateResponse } from "@/features/room/types/RoomStateResponse";
import { getSocket } from "@/lib/socket";
import { CreateRoomForm } from "../components/CreateRoomForm";

export function CreateRoomContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setPlayerId } = usePlayerId();

  const handleCreateRoom = (playerName: string) => {
    if (!playerName.trim()) {
      setError("プレイヤー名を入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    const socket = getSocket();

    // room_created イベントを一度だけ受信
    socket.once(
      "room_created",
      (data: { roomId: string; playerId: string; gameState: RoomStateResponse }) => {
        setIsLoading(false);
        // playerId を localStorage に保存
        setPlayerId(data.playerId);
        // ルーム状態を sessionStorage に一時保存し、遷移後の画面で即座に表示できるようにする
        sessionStorage.setItem(`room_init_state_${data.roomId}`, JSON.stringify(data.gameState));
        // ルームページへ遷移
        router.push(`/rooms/${data.roomId}`);
      },
    );

    // エラーハンドリング
    socket.once("error", (data: { message: string }) => {
      setIsLoading(false);
      setError(data.message);
    });

    // ルーム作成リクエストを送信
    socket.emit("create_room", { playerName });
  };

  return <CreateRoomForm onSubmit={handleCreateRoom} isLoading={isLoading} error={error} />;
}
