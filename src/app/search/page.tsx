import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientSearchPage from "./ClientSearchPage";

export const metadata: Metadata = pageMetadata(
  "求人を検索",
  "職種・地域・キーワードから求人を検索。アルバイト・単発・正社員まで、SWIPLYの全求人からあなたに合う仕事を見つけよう。"
);

export default function SearchPage() {
  return <ClientSearchPage />;
}
