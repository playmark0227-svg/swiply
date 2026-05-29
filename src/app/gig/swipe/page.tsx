import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientGigSwipePage from "./ClientGigSwipePage";

export const metadata: Metadata = pageMetadata(
  "単発バイトをスワイプで探す",
  "単発・スキマバイトを写真と動画でチェック。右にスワイプして即日勤務OKの案件に応募。SWIPLYのスワイプ求人。"
);

export default function GigSwipePage() {
  return <ClientGigSwipePage />;
}
