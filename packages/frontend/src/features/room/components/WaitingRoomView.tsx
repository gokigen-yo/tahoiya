"use client";

import { Box, Button, Card, Container, Heading, List, Text, VStack } from "@chakra-ui/react";

type Player = {
  id: string;
  name: string;
};

type WaitingRoomViewProps = {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
  isLoading: boolean;
};

export function WaitingRoomView({
  roomId,
  players,
  isHost,
  onStartGame,
  isLoading,
}: WaitingRoomViewProps) {
  return (
    <Container maxW="container.md" py={10}>
      <VStack gap={8} align="stretch">
        <Box textAlign="center">
          <Heading size="2xl" mb={4}>
            待機ルーム
          </Heading>
          <Text fontSize="lg" color="gray.600">
            プレイヤーが集まるのを待っています...
          </Text>
          <Text fontSize="md" color="gray.500" mt={2}>
            ルームID: {roomId}
          </Text>
        </Box>

        <Card.Root variant="outline">
          <Card.Body>
            <Heading size="md" mb={4}>
              参加者 ({players.length}人)
            </Heading>
            <List.Root listStyleType="none" m={0} p={0} gap={3}>
              {players.map((player) => (
                <List.Item key={player.id} display="flex" alignItems="center">
                  <Box
                    as="span"
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg="green.400"
                    mr={3}
                    display="inline-block"
                  />
                  <Text fontWeight="medium">{player.name}</Text>
                  {isHost && players[0]?.id === player.id && (
                    <Text ml={2} fontSize="sm" color="gray.500" as="span">
                      (ホスト)
                    </Text>
                  )}
                </List.Item>
              ))}
            </List.Root>
          </Card.Body>
        </Card.Root>

        {isHost ? (
          <Button
            colorScheme="blue"
            size="lg"
            width="full"
            onClick={onStartGame}
            loading={isLoading}
            loadingText="開始中..."
            disabled={players.length < 2}
          >
            ゲームを開始する
          </Button>
        ) : (
          <Box textAlign="center" p={4} bg="gray.100" borderRadius="md">
            <Text>ホストがゲームを開始するのを待っています...</Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
