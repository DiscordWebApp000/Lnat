import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LNAT AI Platform - Smart Practice with AI",
  description: "AI-powered LNAT preparation platform. Text analysis, question generation, and performance evaluation to enhance your learning experience.",
  keywords: "LNAT, LNAT AI, AI, yapay zeka, soru üretimi, metin analizi, öğrenme platformu",
  authors: [{ name: "LNAT AI Platform" }],
  creator: "LNAT AI Platform",
  publisher: "LNAT AI Platform",
  robots: "index, follow",
  openGraph: {
    title: "LNAT AI Platform - Smart Practice with AI",
    description: "AI-powered LNAT preparation platform",
    type: "website",
    locale: "tr_TR",
    siteName: "LNAT AI Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "LNAT AI Platform - Smart Practice with AI",
    description: "AI-powered LNAT preparation platform",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
