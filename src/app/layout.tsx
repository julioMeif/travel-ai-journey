// src/app/layout.tsx
// Purpose: Main layout wrapper for the application
// Used as: The root layout component in Next.js app directory structure

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load Inter font
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Travel-AI Journey',
  description: 'AI-powered travel planning experience with a modern glass design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}