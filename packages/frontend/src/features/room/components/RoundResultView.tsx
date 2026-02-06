"use client";

import { Badge, Box, Button, Heading, HStack, Table, Text, VStack } from "@chakra-ui/react";

type MeaningWithAuthor = {
  choiceIndex: number;
  text: string;
  authorId: string;
};

type Vote = {
  voterId: string;
  choiceIndex: number;
  betPoints: number;
};

type Player = {
  id: string;
  name: string;
  score: number;
};

type RoundResultViewProps = {
  theme: string;
  meanings: MeaningWithAuthor[];
  votes: Vote[];
  players: Player[];
  parentPlayerId: string;
  isHost: boolean;
  onNextRound: () => void;
  isLoading: boolean;
};

export function RoundResultView({
  theme,
  meanings,
  votes,
  players,
  parentPlayerId,
  isHost,
  onNextRound,
  isLoading,
}: RoundResultViewProps) {
  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "不明";

  // 選択肢ごとの投票者をまとめる
  const votesByChoice = meanings.map((m) => ({
    ...m,
    voters: votes.filter((v) => v.choiceIndex === m.choiceIndex),
  }));

  return (
    <Box maxW="2xl" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" shadow="md">
      <VStack gap={8} align="stretch">
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500" mb={1}>
            結果発表 - お題
          </Text>
          <Heading size="xl">{theme}</Heading>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            回答一覧
          </Heading>
          <VStack gap={4} align="stretch">
            {votesByChoice.map((choice) => {
              const isCorrect = choice.authorId === parentPlayerId;
              const authorName = getPlayerName(choice.authorId);

              return (
                <Box
                  key={choice.choiceIndex}
                  p={4}
                  borderWidth={2}
                  borderRadius="md"
                  borderColor={isCorrect ? "green.400" : "gray.200"}
                  bg={isCorrect ? "green.50" : "white"}
                >
                  <HStack justify="space-between" mb={2} wrap="wrap">
                    <Text fontWeight="bold" fontSize="lg">
                      {choice.text}
                    </Text>
                    <HStack>
                      {isCorrect ? (
                        <Badge colorPalette="green" variant="solid">
                          正解！
                        </Badge>
                      ) : (
                        <Badge colorPalette="orange" variant="outline">
                          {authorName} の嘘
                        </Badge>
                      )}
                    </HStack>
                  </HStack>

                  <Box mt={3}>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      投票者:
                    </Text>
                    {choice.voters.length > 0 ? (
                      <HStack gap={2} wrap="wrap">
                        {choice.voters.map((vote) => (
                          <Badge key={vote.voterId} colorPalette="blue" variant="subtle">
                            {getPlayerName(vote.voterId)} ({vote.betPoints}点)
                          </Badge>
                        ))}
                      </HStack>
                    ) : (
                      <Text fontSize="sm" color="gray.400" fontStyle="italic">
                        投票なし
                      </Text>
                    )}
                  </Box>
                </Box>
              );
            })}
          </VStack>
        </Box>

        {isHost && (
          <Button
            onClick={onNextRound}
            colorPalette="blue"
            size="lg"
            loading={isLoading}
            width="full"
          >
            次のラウンドへ
          </Button>
        )}
        {!isHost && (
          <Box textAlign="center" p={4} bg="gray.50" borderRadius="md">
            <Text color="gray.600">ホストが次のラウンドを開始するのを待っています...</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
