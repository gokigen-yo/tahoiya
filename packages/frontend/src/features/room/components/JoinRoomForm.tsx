"use client";

import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

type JoinRoomFormProps = {
  onSubmit: (playerName: string) => void;
  isLoading: boolean;
  error: string | null;
};

export function JoinRoomForm({ onSubmit, isLoading, error }: JoinRoomFormProps) {
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(playerName);
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" shadow="md">
      <VStack gap={6} align="stretch">
        <Heading size="xl" textAlign="center">
          ルームに参加
        </Heading>

        <Box>
          <Text fontSize="md" color="gray.600">
            プレイヤー名を入力して、ルームに参加してください。
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            <Box>
              <Text mb={2} fontWeight="medium">
                プレイヤー名
              </Text>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="プレイヤー名を入力"
                disabled={isLoading}
              />
            </Box>

            {error && (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            )}

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              loading={isLoading}
              loadingText="参加中"
            >
              ルームに参加
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}
