import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientBaitoSwipePage from "./ClientBaitoSwipePage";

export const metadata: Metadata = pageMetadata(
  "アルバイトをスワイプで探す",
  "アルバイト求人を写真と動画でチェック。右にスワイプして気になるバイトに応募。SWIPLYのスワイプ求人。"
);

export default function BaitoSwipePage() {
  return <ClientBaitoSwipePage />;
}
