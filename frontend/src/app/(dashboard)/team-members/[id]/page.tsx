import { PagePlaceholder } from "@/components/page-placeholder";
import { UserRound } from "lucide-react";

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title={`Team member #${id}`}
      description="View profile, activity, and reports for this member."
      icon={UserRound}
    />
  );
}
