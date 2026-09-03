import { PagePlaceholder } from "@/components/page-placeholder";
import { FileSearch } from "lucide-react";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title={`Report #${id}`}
      description="Detailed view of this weekly report."
      icon={FileSearch}
    />
  );
}
