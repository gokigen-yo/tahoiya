import { Box, Text, VStack } from "@chakra-ui/react";

type Player = {
  id: string;
  name: string;
  score: number;
};

type PlayerListProps = {
  players: Player[];
  currentPlayerId?: string;
  parentPlayerId?: string;
};

export function PlayerList({ players, currentPlayerId, parentPlayerId }: PlayerListProps) {
  return (
    <Box
      bg="gray.50"
      borderRadius="md"
      p={4}
      minW="200px"
      maxW="300px"
      h="fit-content"
      boxShadow="sm"
    >
      <Text fontSize="lg" fontWeight="bold" mb={3}>
        プレイヤー
      </Text>
      <VStack gap={2} align="stretch">
        {players.map((player) => {
          const isParent = player.id === parentPlayerId;
          const isCurrent = player.id === currentPlayerId;

          return (
            <Box
              key={player.id}
              p={3}
              bg={isParent ? "blue.100" : isCurrent ? "green.50" : "white"}
              borderRadius="md"
              borderWidth={isParent ? 2 : 1}
              borderColor={isParent ? "blue.500" : "gray.200"}
            >
              <Text fontWeight={isParent ? "bold" : "medium"} fontSize="sm">
                {player.name}
                {isParent && " (親)"}
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {player.score}点
              </Text>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
