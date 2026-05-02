import type { Metadata } from "next";
import ClientBusinessPage from "./ClientBusinessPage";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

export const metadata: Metadata = {
  title: "SWIPLY for Business / 動画スワイプ求人サイト | 企業向けサービス",
  description:
    "動画とスワイプで採用を変えるSWIPLY。リリース前、最初の100社限定で永続20%オフのファウンディングメンバーを募集中。",
  openGraph: {
    title: "SWIPLY for Business / 動画でわかる、スワイプで決まる。",
    description:
      "動画とスワイプで採用を変えるSWIPLY。リリース前、最初の100社限定で永続20%オフのファウンディングメンバーを募集中。",
    images: [`${BASE_PATH}/icon-512.png`],
  },
};

export default function BusinessPage() {
  return <ClientBusinessPage />;
}
