import { jobs } from "@/data/jobs";
import ClientJobDetailPage from "./ClientJobDetailPage";

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  return <ClientJobDetailPage jobId={params.id} />;
}
