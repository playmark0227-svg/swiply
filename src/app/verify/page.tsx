import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ClientVerifyPage from "./ClientVerifyPage";

export const metadata: Metadata = pageMetadata(
  "本人確認",
  "SWIPLYの本人確認について。安心・安全なマッチングのための確認ステップをご案内します。"
);

export default function VerifyPage() {
  return <ClientVerifyPage />;
}
