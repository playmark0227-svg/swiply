import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientCareerSwipePage from "./ClientCareerSwipePage";

export const metadata: Metadata = pageMetadata(
  "正社員求人をスワイプで探す",
  "正社員・転職求人を写真と動画でチェック。右にスワイプして気になる企業に応募。SWIPLYのスワイプ求人。"
);

export default function CareerSwipePage() {
  return <ClientCareerSwipePage />;
}
