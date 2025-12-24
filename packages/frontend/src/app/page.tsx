"use client";

import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

let socket: Socket;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [pongMessage, setPongMessage] = useState("");

  useEffect(() => {
    // Initialize socket connection
    // Note: In production, URL should be environment variable
    socket = io("http://localhost:3001");

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("pong", (data: { message: string }) => {
      setPongMessage(data.message);
      console.log("Pong received:", data.message);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const sendPing = () => {
    if (socket) {
      socket.emit("ping");
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack gap={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Tahoiya WebSocket Test (App Router)
        </Heading>

        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
          <VStack gap={4}>
            <Text fontSize="lg">
              Status:
              <Text
                as="span"
                ml={2}
                color={isConnected ? "green.500" : "red.500"}
                fontWeight="bold"
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Text>
            </Text>

            <Button colorPalette="blue" onClick={sendPing} disabled={!isConnected} size="lg">
              Send Ping
            </Button>

            {pongMessage && (
              <Box p={4} mt={4} bg="gray.50" borderRadius="md" w="100%">
                <Text fontWeight="bold" mb={2}>
                  Server Response:
                </Text>
                <Text>{pongMessage}</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
