import type { Metadata } from "next";
import ClientBusinessPage from "./ClientBusinessPage";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

const BIZ_DESCRIPTION =
  "動画とスワイプで採用を変えるSWIPLY。アプリ内ビデオ面接 + AI 振り返りで工数削減。リリース前、最初の100社限定で永続20%オフのファウンディングメンバーを募集中。";

export const metadata: Metadata = {
  title: "SWIPLY for Business — 動画とスワイプで、採用を変える。",
  description: BIZ_DESCRIPTION,
  openGraph: {
    title: "SWIPLY for Business — 動画でわかる、スワイプで決まる。",
    description: BIZ_DESCRIPTION,
    type: "website",
    locale: "ja_JP",
    siteName: "SWIPLY",
    images: [`${BASE_PATH}/icon-512.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "SWIPLY for Business — 動画とスワイプで採用を変える。",
    description: BIZ_DESCRIPTION,
    images: [`${BASE_PATH}/icon-512.png`],
  },
};

export default function BusinessPage() {
  return <ClientBusinessPage />;
}
