import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientBaitoPage from "./ClientBaitoPage";

export const metadata: Metadata = pageMetadata(
  "アルバイト求人をスワイプで探す",
  "写真と動画でバイト先がわかる。気になったら右にスワイプ、マッチしたらそのままチャット。履歴書なしで始められるアルバイト探しはSWIPLYで。"
);

export default function BaitoPage() {
  return <ClientBaitoPage />;
}
