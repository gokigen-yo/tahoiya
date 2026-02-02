"use client";

import { Center, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { usePlayerId } from "@/features/room/hooks/usePlayerId";
import type { RoomStateResponse } from "../types/RoomStateResponse";
import { JoinRoomContainer } from "./JoinRoomContainer";
import { RoomContainer } from "./RoomContainer";

type RoomAuthGuardProps = {
  roomId: string;
};

export function RoomAuthGuard({ roomId }: RoomAuthGuardProps) {
  const { playerId, setPlayerId } = usePlayerId();
  const [initialGameState, setInitialGameState] = useState<RoomStateResponse | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`room_init_state_${roomId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          sessionStorage.removeItem(`room_init_state_${roomId}`);
          return parsed;
        } catch (e) {
          console.error("Failed to parse initial state", e);
        }
      }
    }
    return null;
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
