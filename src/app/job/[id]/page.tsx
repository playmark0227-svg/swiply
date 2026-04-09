import { jobs } from "@/data/jobs";
import ClientJobDetailPage from "./ClientJobDetailPage";

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientJobDetailPage jobId={id} />;
}
