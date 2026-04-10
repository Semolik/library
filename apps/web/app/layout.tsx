import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';

import '@workspace/ui/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth/auth-context';
import { Toaster } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Library',
    template: '%s · Library',
  },
  description: 'Базовая обёртка проекта с авторизацией и типизированными формами.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn(
        'antialiased',
        geist.variable,
        fontMono.variable,
        inter.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
