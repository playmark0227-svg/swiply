import type { Metadata } from "next";
import ClientAdminScoutPage from "./ClientAdminScoutPage";

export const metadata: Metadata = {
  title: "AIスカウト / SWIPLY 管理",
  description: "候補者向けに AI が個別文を生成するスカウトツール。",
  robots: { index: false, follow: false },
};

export default function AdminScoutPage() {
  return <ClientAdminScoutPage />;
}
