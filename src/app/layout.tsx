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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://playmark0227-svg.github.io"
      : "http://localhost:3000"
  ),
  title: "SWIPLY - 履歴書の前に、スワイプでいい。",
  description:
    "スワイプひとつで、会いたい企業まで最短距離。履歴書も長文応募も要らない、新しい求人の探し方。",
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
  openGraph: {
    title: "SWIPLY - 履歴書の前に、スワイプでいい。",
    description:
      "スワイプひとつで、会いたい企業まで最短距離。履歴書も長文応募も要らない、新しい求人の探し方。",
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
