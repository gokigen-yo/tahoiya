"use client";

import { Box, Button, Heading, Text, Textarea, VStack } from "@chakra-ui/react";
import { useState } from "react";

type MeaningInputViewProps = {
  theme: string;
  isParent: boolean;
  hasSubmitted: boolean;
  onSubmit: (meaning: string) => void;
  isLoading: boolean;
};

export function MeaningInputView({
  theme,
  isParent,
  hasSubmitted,
  onSubmit,
  isLoading,
}: MeaningInputViewProps) {
  const [meaning, setMeaning] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meaning.trim()) return;
    onSubmit(meaning);
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" shadow="md">
      <VStack gap={6} align="stretch">
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500" mb={1}>
            今回のお題
          </Text>
          <Heading size="xl">{theme}</Heading>
        </Box>

        {hasSubmitted ? (
          <Box textAlign="center" py={8}>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              送信しました！
            </Text>
            <Text color="gray.600">他のプレイヤーの入力待ちです...</Text>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Box>
                <Text mb={4} fontSize="lg">
                  {isParent ? (
                    <>
                      あなたは親です。
                      <br />
                      <Text as="span" fontWeight="bold" color="blue.600">
                        正しい意味
                      </Text>
                      を入力してください。
                    </>
                  ) : (
                    <>
                      あなたは子です。
                      <br />
                      <Text as="span" fontWeight="bold" color="orange.600">
                        相手を騙すための嘘の意味
                      </Text>
                      を入力してください。
                    </>
                  )}
                </Text>
                <Textarea
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder={
                    isParent ? "辞書に載っている正しい意味を入力" : "もっともらしい嘘の意味を入力"
                  }
                  size="lg"
                  rows={4}
                  disabled={isLoading}
                  autoFocus
                />
              </Box>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                loading={isLoading}
                disabled={!meaning.trim() || isLoading}
              >
                決定
              </Button>
            </VStack>
          </form>
        )}
      </VStack>
    </Box>
  );
}
