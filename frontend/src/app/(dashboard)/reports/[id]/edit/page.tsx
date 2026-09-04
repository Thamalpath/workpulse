import ReportFormPage from "../../create/page";
import { decodeId } from "@/lib/id";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportFormPage editId={decodeId(id)} />;
}