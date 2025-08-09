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
  title: "LNAT AI Platform - Akıllı Öğrenme Asistanı",
  description: "Yapay zeka destekli LNAT sınavı hazırlık platformu. Metin analizi, soru üretimi ve performans değerlendirmesi ile öğrenme deneyiminizi geliştirin.",
  keywords: "LNAT, hukuk sınavı, AI, yapay zeka, soru üretimi, metin analizi, öğrenme platformu",
  authors: [{ name: "LNAT AI Platform" }],
  creator: "LNAT AI Platform",
  publisher: "LNAT AI Platform",
  robots: "index, follow",
  openGraph: {
    title: "LNAT AI Platform - Akıllı Öğrenme Asistanı",
    description: "Yapay zeka destekli LNAT sınavı hazırlık platformu",
    type: "website",
    locale: "tr_TR",
    siteName: "LNAT AI Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "LNAT AI Platform - Akıllı Öğrenme Asistanı",
    description: "Yapay zeka destekli LNAT sınavı hazırlık platformu",
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
