"use client";

import { Box, Button, Field, Heading, Input, Text, VStack } from "@chakra-ui/react";
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
  onSubmit: (choiceIndex: number, betPoints: number) => void;
  isLoading: boolean;
};

export function VotingView({
  theme,
  meanings,
  isParent,
  hasVoted,
  selectedChoiceIndex,
  onSubmit,
  isLoading,
}: VotingViewProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(
    selectedChoiceIndex !== undefined ? selectedChoiceIndex.toString() : null,
  );
  const [betPoints, setBetPoints] = useState<string>("1");

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

              if (canVote) {
                return (
                  <Button
                    key={meaning.choiceIndex}
                    variant={isSelected ? "solid" : "outline"}
                    colorPalette={isSelected ? "blue" : "gray"}
                    onClick={() => setSelectedChoice(meaning.choiceIndex.toString())}
                    disabled={isLoading}
                    justifyContent="flex-start"
                    height="auto"
                    py={3}
                    whiteSpace="normal"
                    textAlign="left"
                  >
                    {meaning.text}
                  </Button>
                );
              }

              return (
                <Box
                  key={meaning.choiceIndex}
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  textAlign="left"
                  bg={isSelected ? "blue.50" : "gray.50"}
                  borderColor={isSelected ? "blue.200" : "gray.200"}
                >
                  {meaning.text}
                  {isSelected && (
                    <Text as="span" ml={2} fontSize="xs" fontWeight="bold" color="blue.600">
                      (あなたの選択)
                    </Text>
                  )}
                </Box>
              );
            })}
          </VStack>
        </Box>

        {isParent ? (
          <Box textAlign="center" py={4} borderTopWidth={1} pt={6}>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              あなたは親です
            </Text>
            <Text color="gray.600">子プレイヤーが投票を終えるまでお待ちください。</Text>
          </Box>
        ) : hasVoted ? (
          <Box textAlign="center" py={4} borderTopWidth={1} pt={6}>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              投票完了！
            </Text>
            <Text color="gray.600">他のプレイヤーの投票待ちです...</Text>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch" borderTopWidth={1} pt={6}>
              <Field.Root>
                <Field.Label>賭け点</Field.Label>
                <Input
                  type="number"
                  value={betPoints}
                  onChange={(e) => setBetPoints(e.target.value)}
                  min={1}
                  max={3}
                  disabled={isLoading}
                />
                <Field.HelperText>1〜3点の間で賭けてください。</Field.HelperText>
              </Field.Root>

              <Button
                type="submit"
                colorPalette="blue"
                size="lg"
                loading={isLoading}
                disabled={selectedChoice === null || isLoading}
              >
                投票する
              </Button>
            </VStack>
          </form>
        )}
      </VStack>
    </Box>
  );
}
