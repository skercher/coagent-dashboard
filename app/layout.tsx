import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | CoAgent',
    default: 'CoAgent'
  },
  description: 'Your AI-powered conversation platform'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">
        {children}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
