import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueueProvider } from "@/context/QueueContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QueueFlow AI - Universal Smart Queue Management Platform",
  description: "Eliminate physical waiting lines with QR codes, real-time live queue tracking, and automated turn notifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#030303] text-[#f5f5f7] antialiased`}>
        <QueueProvider>
          {children}
        </QueueProvider>
      </body>
    </html>
  );
}

