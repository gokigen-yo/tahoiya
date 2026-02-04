"use client";

import { Box, Container, Flex, Heading } from "@chakra-ui/react";
import Link from "next/link";

export function Header() {
  return (
    <Box
      as="header"
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg="white"
      position="sticky"
      top={0}
      zIndex="sticky"
    >
      <Container maxW="container.xl">
        <Flex h="16" alignItems="center" justifyContent="space-between">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Heading size="md" color="blue.600">
              たほいや
            </Heading>
          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
