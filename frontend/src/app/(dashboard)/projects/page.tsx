import { PagePlaceholder } from "@/components/page-placeholder";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  return (
    <PagePlaceholder
      title="Projects"
      description="Manage and track all your active projects."
      icon={FolderKanban}
    />
  );
}
