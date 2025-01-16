import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Co Work Agent Dashboard',
  description:
    'A user admin dashboard for Co Work Agent AI',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="flex min-h-screen w-full flex-col">
        {children}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
