import type { Metadata } from "next";
import ClientAdminPage from "./ClientAdminPage";

export const metadata: Metadata = {
  title: "ViFight 管理コンソール / SWIPLY",
  description: "SWIPLY 運営者向け管理画面（ViFight）",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <ClientAdminPage />;
}
