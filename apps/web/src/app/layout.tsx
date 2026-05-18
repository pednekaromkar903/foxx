import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from 'sonner';
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PerformX — Goal Setting & Performance Tracking Portal",
  description: "Enterprise-grade Goal Setting, Approval Workflows, and Performance Tracking for Atomberg Technologies.",
  keywords: ["PerformX", "Goal Management", "Performance Tracking", "Atomberg", "AtomQuest 2026"],
};

import Chatbot from "@/components/Chatbot";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Chatbot />
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
