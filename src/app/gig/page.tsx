import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientGigPage from "./ClientGigPage";

export const metadata: Metadata = pageMetadata(
  "単発・スキマバイトをスワイプで探す",
  "今日・明日に入れる単発バイトをスワイプで。面接なし・即日勤務OKの案件多数。スキマ時間にサクッと稼ぎたいならSWIPLY。"
);

export default function GigPage() {
  return <ClientGigPage />;
}
