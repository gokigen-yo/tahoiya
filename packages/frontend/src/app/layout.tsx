import { Providers } from './providers';

export const metadata = {
    title: 'Tahoiya Game',
    description: 'WebSocket Game Application',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
