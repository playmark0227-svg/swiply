import type { Metadata, Viewport } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";
import {
  BASE_PATH,
  SITE_ORIGIN,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Latin geometric display face — reserved for eyebrows, the SWIPLY wordmark
// and large stat numerals. Gives the Latin type a designed voice without
// stealing the JP headings' native gothic character.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const OG_IMAGE = {
  url: `${BASE_PATH}/og.jpg`,
  width: 1200,
  height: 630,
  alt: SITE_TITLE,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production" ? SITE_ORIGIN : "http://localhost:3000"
  ),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: `${BASE_PATH}/`,
  },
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-to-zoom is left enabled on purpose — disabling it (maximumScale/
  // userScalable) is a WCAG 1.4.4 failure and hurts low-vision users.
  themeColor: "#fbf8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
