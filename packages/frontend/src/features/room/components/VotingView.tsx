"use client";

import { Box, Button, Field, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

type Meaning = {
  choiceIndex: number;
  text: string;
};

type VotingViewProps = {
  theme: string;
  meanings: Meaning[];
  isParent: boolean;
  hasVoted: boolean;
  selectedChoiceIndex?: number;
  selectedBetPoints?: number;
  onSubmit: (choiceIndex: number, betPoints: number) => void;
  isLoading: boolean;
};

export function VotingView({
  theme,
  meanings,
  isParent,
  hasVoted,
  selectedChoiceIndex,
  selectedBetPoints,
  onSubmit,
  isLoading,
}: VotingViewProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(
    selectedChoiceIndex !== undefined ? selectedChoiceIndex.toString() : null,
  );
  const [betPoints, setBetPoints] = useState<string>(
    selectedBetPoints !== undefined ? selectedBetPoints.toString() : "1",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChoice === null) return;
    onSubmit(Number.parseInt(selectedChoice, 10), Number.parseInt(betPoints, 10));
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" shadow="md">
      <VStack gap={6} align="stretch">
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500" mb={1}>
            お題
          </Text>
          <Heading size="xl">{theme}</Heading>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={3}>
            提示されている意味の一覧:
          </Text>
          <VStack align="stretch" gap={3}>
            {meanings.map((meaning) => {
              const isSelected = selectedChoice === meaning.choiceIndex.toString();
              const canVote = !isParent && !hasVoted;

              return (
                <Button
                  key={meaning.choiceIndex}
                  variant={isSelected ? "solid" : "outline"}
                  colorPalette={isSelected ? "blue" : "gray"}
                  onClick={
                    canVote ? () => setSelectedChoice(meaning.choiceIndex.toString()) : undefined
                  }
                  disabled={!canVote || isLoading}
                  justifyContent="flex-start"
                  height="auto"
                  py={3}
                  whiteSpace="normal"
                  textAlign="left"
                >
                  <Box as="span" flex="1">
                    {meaning.text}
                  </Box>
                </Button>
              );
            })}
          </VStack>
        </Box>

        <Box borderTopWidth={1} pt={6}>
          <VStack gap={6} align="stretch">
            {isParent && (
              <Box textAlign="center" mb={2}>
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  あなたは親です
                </Text>
                <Text color="gray.600">子プレイヤーが投票を終えるまでお待ちください。</Text>
              </Box>
            )}

            {!isParent && (
              <Field.Root>
                <Field.Label>賭け点</Field.Label>
                <HStack gap={4}>
                  {["1", "2", "3"].map((points) => {
                    const isSelected = betPoints === points;
                    const canVote = !hasVoted;

                    return (
                      <Button
                        key={points}
                        flex="1"
                        variant={isSelected ? "solid" : "outline"}
                        colorPalette={isSelected ? "orange" : "gray"}
                        onClick={canVote ? () => setBetPoints(points) : undefined}
                        disabled={!canVote || isLoading}
                      >
                        {points}点
                      </Button>
                    );
                  })}
                </HStack>
                {!hasVoted && <Field.HelperText>1〜3点の間で賭けてください。</Field.HelperText>}
              </Field.Root>
            )}

            {!isParent &&
              (hasVoted ? (
                <Box textAlign="center" py={2}>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    投票完了！
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    他のプレイヤーの投票待ちです...
                  </Text>
                </Box>
              ) : (
                <Button
                  onClick={handleSubmit}
                  colorPalette="blue"
                  size="lg"
                  loading={isLoading}
                  disabled={selectedChoice === null || isLoading}
                >
                  投票する
                </Button>
              ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
