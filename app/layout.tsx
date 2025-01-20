import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    template: '%s | Coagent',
    default: 'Coagent',
  },
  description: 'AI Agents for your business',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
