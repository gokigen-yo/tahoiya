"use client";

import { useState } from "react";
import type { RoomStateResponse } from "@/features/room/types/RoomStateResponse";
import { getSocket } from "@/lib/socket";
import { JoinRoomForm } from "../components/JoinRoomForm";

type JoinRoomContainerProps = {
  roomId: string;
  onJoin: (playerId: string, gameState: RoomStateResponse) => void;
};

export function JoinRoomContainer({ roomId, onJoin }: JoinRoomContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinRoom = (playerName: string) => {
    if (!playerName.trim()) {
      setError("プレイヤー名を入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    const socket = getSocket();

    socket.once(
      "join_success",
      (data: { roomId: string; playerId: string; gameState: RoomStateResponse }) => {
        setIsLoading(false);
        onJoin(data.playerId, data.gameState);
      },
    );

    socket.once("error", (data: { message: string }) => {
      setIsLoading(false);
      setError(data.message);
    });

    socket.emit("join_room", { roomId, playerName });
  };

  return <JoinRoomForm onSubmit={handleJoinRoom} isLoading={isLoading} error={error} />;
}
