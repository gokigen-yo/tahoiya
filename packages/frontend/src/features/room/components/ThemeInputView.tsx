"use client";

import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

type ThemeInputViewProps = {
  round: number;
  isParent: boolean;
  parentName: string;
  onSubmit: (theme: string) => void;
  isLoading: boolean;
};

export function ThemeInputView({
  round,
  isParent,
  parentName,
  onSubmit,
  isLoading,
}: ThemeInputViewProps) {
  const [theme, setTheme] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    onSubmit(theme);
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" shadow="md">
      <VStack gap={6} align="stretch">
        <Heading size="lg" textAlign="center">
          第{round}ラウンド
        </Heading>

        {isParent ? (
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Box>
                <Text mb={4} fontSize="lg">
                  あなたは親です。
                  <br />
                  お題を入力してください。
                </Text>
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="お題（単語）を入力"
                  disabled={isLoading}
                  autoFocus
                />
              </Box>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                loading={isLoading}
                disabled={!theme.trim() || isLoading}
              >
                決定
              </Button>
            </VStack>
          </form>
        ) : (
          <Box textAlign="center">
            <Text fontSize="lg" mb={4}>
              親（{parentName}）がお題を考えています...
            </Text>
            <Text color="gray.500">しばらくお待ちください</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
