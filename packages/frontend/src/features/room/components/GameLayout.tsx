import { Box, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { PlayerList } from "./PlayerList";

type Player = {
  id: string;
  name: string;
  score: number;
};

type GameLayoutProps = {
  children: ReactNode;
  players: Player[];
  currentPlayerId?: string;
  parentPlayerId?: string;
};

export function GameLayout({
  children,
  players,
  currentPlayerId,
  parentPlayerId,
}: GameLayoutProps) {
  return (
    <Flex gap={6} p={6} minH="100vh" direction={{ base: "column", md: "row" }}>
      {/* メインコンテンツエリア */}
      <Box flex={1}>{children}</Box>

      {/* プレイヤー一覧 */}
      <Box>
        <PlayerList
          players={players}
          currentPlayerId={currentPlayerId}
          parentPlayerId={parentPlayerId}
        />
      </Box>
    </Flex>
  );
}
