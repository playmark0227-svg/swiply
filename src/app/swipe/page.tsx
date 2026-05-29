import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientSwipePage from "./ClientSwipePage";

export const metadata: Metadata = pageMetadata(
  "スワイプで求人を探す",
  "写真を見て、右にスワイプ。それだけ。履歴書も長文応募もいらない、新しい仕事の見つけ方をSWIPLYで。"
);

export default function SwipePage() {
  return <ClientSwipePage />;
}
