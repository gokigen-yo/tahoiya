"use client";

import { Center, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { usePlayerId } from "@/features/room/hooks/usePlayerId";
import { useRoomInitialState } from "../hooks/useRoomInitialState";
import type { RoomStateResponse } from "../types/RoomStateResponse";
import { JoinRoomContainer } from "./JoinRoomContainer";
import { RoomContainer } from "./RoomContainer";

type RoomAuthGuardProps = {
  roomId: string;
};

export function RoomAuthGuard({ roomId }: RoomAuthGuardProps) {
  const { playerId, setPlayerId } = usePlayerId();
  const { getInitialState } = useRoomInitialState(roomId);
  const [initialGameState, setInitialGameState] = useState<RoomStateResponse | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 初回マウント時にのみ sessionStorage から取得を試みる
    const savedState = getInitialState();
    if (savedState) {
      setInitialGameState(savedState);
    }
  }, [getInitialState]);

  const handleJoin = (newPlayerId: string, gameState: RoomStateResponse) => {
    setPlayerId(newPlayerId);
    setInitialGameState(gameState);
  };

  if (!isClient) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!playerId) {
    return <JoinRoomContainer roomId={roomId} onJoin={handleJoin} />;
  }

  return (
    <RoomContainer
      roomId={roomId}
      playerId={playerId}
      initialGameState={initialGameState || undefined}
    />
  );
}
