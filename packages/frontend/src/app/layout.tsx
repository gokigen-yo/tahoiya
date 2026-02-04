import { Box } from "@chakra-ui/react";
import { Header } from "@/components/Header/Header";
import { Providers } from "./providers";

export const metadata = {
  title: "Tahoiya Game",
  description: "WebSocket Game Application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <Box as="main" flex="1">
            {children}
          </Box>
        </Providers>
      </body>
    </html>
  );
}
