import ReportFormPage from "../../create/page";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportFormPage editId={id} />;
}
