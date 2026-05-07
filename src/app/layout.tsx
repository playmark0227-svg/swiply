import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

const SITE_DESCRIPTION =
  "履歴書の前に、スワイプでいい。求人の発見からマッチ後のチャット、ビデオ面接 + AI 振り返りまで、就職活動のひと通りをアプリ１つで。";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://playmark0227-svg.github.io"
      : "http://localhost:3000"
  ),
  title: {
    default: "SWIPLY — 履歴書の前に、スワイプでいい。",
    template: "%s | SWIPLY",
  },
  description: SITE_DESCRIPTION,
  applicationName: "SWIPLY",
  keywords: [
    "求人",
    "転職",
    "アルバイト",
    "新卒",
    "スワイプ",
    "ビデオ面接",
    "AI 面接",
    "SWIPLY",
  ],
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
  openGraph: {
    title: "SWIPLY — 履歴書の前に、スワイプでいい。",
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ja_JP",
    siteName: "SWIPLY",
    images: [`${BASE_PATH}/icon-512.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "SWIPLY — 履歴書の前に、スワイプでいい。",
    description: SITE_DESCRIPTION,
    images: [`${BASE_PATH}/icon-512.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbf8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
