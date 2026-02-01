"use client";

import { Box, Button, Center, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { usePlayerId } from "@/features/room/hooks/usePlayerId";
import { JoinRoomContainer } from "./JoinRoomContainer";

type RoomAuthGuardProps = {
  roomId: string;
};

export function RoomAuthGuard({ roomId }: RoomAuthGuardProps) {
  const { playerId, setPlayerId, clearPlayerId } = usePlayerId();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!playerId) {
    return <JoinRoomContainer roomId={roomId} onJoin={setPlayerId} />;
  }

  // TODO: 将来的に RoomContainer を実装して置き換える
  return (
    <Box maxW="container.md" mx="auto" mt={8} p={6}>
      <VStack gap={6}>
        <Heading>ルーム: {roomId}</Heading>
        <Text fontSize="xl">
          参加中プレイヤーID: <strong>{playerId}</strong>
        </Text>
        <Box>
          <Button onClick={clearPlayerId} colorScheme="red" variant="outline" size="sm">
            退出する（デバッグ用）
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
