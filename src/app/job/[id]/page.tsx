import { getAllJobIds } from "@/lib/services/jobs";
import ClientJobDetailPage from "./ClientJobDetailPage";

export function generateStaticParams() {
  return getAllJobIds().map((id) => ({ id }));
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientJobDetailPage jobId={id} />;
}
