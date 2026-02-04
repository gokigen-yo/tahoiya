"use client";

import { Badge, Box, Button, Circle, Heading, HStack, Table, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { LuTrophy } from "react-icons/lu";

type Player = {
  id: string;
  name: string;
  score: number;
};

type FinalResultViewProps = {
  players: Player[];
  winnerIds: string[];
};

export function FinalResultView({ players, winnerIds }: FinalResultViewProps) {
  const router = useRouter();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winners = players.filter((p) => winnerIds.includes(p.id));

  return (
    <Box maxW="2xl" mx="auto" mt={8} p={8} borderWidth={1} borderRadius="xl" shadow="xl" bg="white">
      <VStack gap={8} align="stretch">
        <VStack gap={2} textAlign="center">
          <Circle size="64px" bg="yellow.100" color="yellow.600">
            <LuTrophy size="32px" />
          </Circle>
          <Heading size="2xl">最終結果発表</Heading>
          <Text color="gray.500">ゲームが終了しました。お疲れ様でした！</Text>
        </VStack>

        <Box
          p={6}
          bg="orange.50"
          borderRadius="lg"
          textAlign="center"
          borderWidth={2}
          borderColor="orange.200"
        >
          <Text fontSize="lg" fontWeight="bold" color="orange.700" mb={4}>
            🏆 優勝 🏆
          </Text>
          <VStack gap={2}>
            {winners.map((winner) => (
              <Heading key={winner.id} size="xl" color="orange.800">
                {winner.name}
              </Heading>
            ))}
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            最終スコア一覧
          </Heading>
          <Table.Root size="md" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width="100px">順位</Table.ColumnHeader>
                <Table.ColumnHeader>プレイヤー</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">スコア</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedPlayers.map((player, index) => {
                const isWinner = winnerIds.includes(player.id);
                return (
                  <Table.Row key={player.id} bg={isWinner ? "yellow.50" : undefined}>
                    <Table.Cell>
                      <Text fontWeight="bold">{index + 1}位</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack>
                        <Text fontWeight={isWinner ? "bold" : "normal"}>{player.name}</Text>
                        {isWinner && (
                          <Badge colorPalette="yellow" variant="solid" size="xs">
                            WINNER
                          </Badge>
                        )}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="bold">
                      {player.score}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>

        <Button
          onClick={() => router.push("/")}
          colorPalette="gray"
          variant="outline"
          size="lg"
          width="full"
        >
          トップ画面に戻る
        </Button>
      </VStack>
    </Box>
  );
}
