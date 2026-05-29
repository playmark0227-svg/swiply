import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientCareerPage from "./ClientCareerPage";

export const metadata: Metadata = pageMetadata(
  "正社員・転職をスワイプで探す",
  "職場の雰囲気が動画でわかる正社員求人。気になる企業に1スワイプ、マッチしたら直接チャット。履歴書の前に、まずスワイプ。"
);

export default function CareerPage() {
  return <ClientCareerPage />;
}
