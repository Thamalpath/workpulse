"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FullPageLoader } from "@/components/loader";
import { useAuth } from "@/contexts/auth-context";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import {
  archiveProject,
  createProject,
  deleteProject,
  getProject,
  getProjects,
  setProjectMembers,
  updateProject,
  type Project,
  type ProjectMember,
} from "@/services/project.service";
import { getUsers, type ManageUser } from "@/services/user.service";

type ProjectDialogState =
  | { mode: "create" }
  | { mode: "edit"; project: Project }
  | null;

type MemberDialogState = { project: Project } | null;

function ProjectDialog({
  state,
  onClose,
  onSaved,
}: {
  state: Exclude<ProjectDialogState, null>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = state.mode === "edit" ? state.project : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setErrors((prev) => (prev.name ? { ...prev, name: undefined } : prev));
  }

  function validateForm(nameValue: string) {
    const next: { name?: string } = {};
    const trimmed = nameValue.trim();

    if (!trimmed) {
      next.name = "Project name is required.";
    } else if (trimmed.length < 2) {
      next.name = "Project name must be at least 2 characters.";
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const issues = validateForm(name);
    if (issues.name) {
      setErrors(issues);
      toast.warning("Please fill the required fields.");
      return;
    }

    setSaving(true);
    try {
      const trimmedName = name.trim();
      if (editing) {
        await updateProject(editing.id, {
          name: trimmedName,
          description: description.trim() || undefined,
        });
      } else {
        await createProject({
          name: trimmedName,
          description: description.trim() || undefined,
        });
      }
      toast.success(
        editing
          ? `Project "${trimmedName}" updated.`
          : `Project "${trimmedName}" created.`,
      );
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the project details. Reports keep referencing this project."
              : "Create a new project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Atlas CRM"
              aria-invalid={errors.name ? true : undefined}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-[#C85C5C]" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function nameInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function MembersDialog({
  state,
  onClose,
  onSaved,
}: {
  state: Exclude<MemberDialogState, null>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [candidates, setCandidates] = useState<ManageUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [detail, users] = await Promise.all([
          getProject(state.project.id),
          getUsers(),
        ]);
        if (!active) return;

        const adminIds = new Set(
          users
            .filter((user) => user.roles.some((role) => role.key === "admin"))
            .map((user) => user.id),
        );

        const memberIds = detail.members
          .filter((member: ProjectMember) => !adminIds.has(member.id))
          .map((member: ProjectMember) => member.id);

        setSelected(new Set(memberIds));
        setCandidates(users.filter((user) => !adminIds.has(user.id)));
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load team members.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [state.project.id]);

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q),
    );
  }, [candidates, query]);

  const selectableCandidates = filteredCandidates.filter(
    (user) => user.isActive,
  );
  const allVisibleSelected =
    selectableCandidates.length > 0 &&
    selectableCandidates.every((user) => selected.has(user.id));

  function toggleUser(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const user of selectableCandidates) next.delete(user.id);
      } else {
        for (const user of selectableCandidates) next.add(user.id);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await setProjectMembers(state.project.id, Array.from(selected));
      toast.success(
        `Assignments saved for "${state.project.name}" (${selected.size} member${selected.size === 1 ? "" : "s"}).`,
      );
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign team members</DialogTitle>
          <DialogDescription>
            Select the members working on &quot;{state.project.name}&quot;. You
            can pick multiple users. Admin users are excluded.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-[#4263A3]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {candidates.length === 0 ? (
              <p className="rounded-lg border border-[#E1E6ED] bg-[#F8FAFC] p-4 text-sm text-muted-foreground">
                No non-admin team members are available yet.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {selected.size} selected
                      {query ? ` · ${filteredCandidates.length} match` : ""}
                    </span>
                    {filteredCandidates.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={toggleAllVisible}
                      >
                        {allVisibleSelected ? "Clear all" : "Select all"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid max-h-[40vh] gap-1.5 overflow-y-auto pr-1">
                  {filteredCandidates.length === 0 ? (
                    <p className="rounded-lg border border-[#E1E6ED] bg-[#F8FAFC] p-4 text-sm text-muted-foreground">
                      No users match your search.
                    </p>
                  ) : (
                    filteredCandidates.map((user) => {
                      const checked = selected.has(user.id);
                      return (
                        <label
                          key={user.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                            checked
                              ? "border-[#4263A3]/60 bg-[#4263A3]/5"
                              : "border-[#E1E6ED] hover:border-[#4263A3]/40",
                            !user.isActive && "cursor-not-allowed opacity-60",
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#4263A3]/10 text-xs font-semibold text-[#4263A3]">
                              {nameInitials(user.name)}
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate font-medium text-[#18202F]">
                                {user.name}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </span>
                          </span>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleUser(user.id)}
                            disabled={!user.isActive}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save assignments ({selected.size})
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const { permissions } = useAuth();
  const canView = permissions.includes("project.view");
  const canManage = permissions.includes("project.manage");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>(null);
  const [memberDialog, setMemberDialog] = useState<MemberDialogState>(null);
  const [confirm, confirmNode] = useConfirm();
  const initialFetchRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setProjects(await getProjects());
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleArchive(project: Project) {
    if (
      !(await confirm({
        title: "Archive project",
        message: `Archive "${project.name}"? Existing reports will keep referencing it, but it will no longer be selectable for new reports.`,
        confirmLabel: "Archive",
      }))
    ) {
      return;
    }
    try {
      await archiveProject(project.id);
      toast.success(`Project "${project.name}" archived.`);
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive project.",
      );
    }
  }

  async function handleDelete(project: Project) {
    if (project.reportCount > 0) {
      toast.warning(
        `"${project.name}" has ${project.reportCount} report${
          project.reportCount === 1 ? "" : "s"
        } referencing it. Archive the project instead — it can't be permanently deleted while it has reports.`,
      );
      return;
    }
    if (
      !(await confirm({
        title: "Delete project",
        message: `Permanently delete "${project.name}"? This cannot be undone.`,
        destructive: true,
        confirmLabel: "Delete",
      }))
    ) {
      return;
    }
    try {
      await deleteProject(project.id);
      toast.success(`Project "${project.name}" deleted.`);
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete project.",
      );
    }
  }

  async function handleRestore(project: Project) {
    try {
      await updateProject(project.id, { isActive: true });
      toast.success(`Project "${project.name}" restored.`);
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to restore project.",
      );
    }
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (!canView) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <FolderKanban className="size-10 text-[#596273]" />
        <p className="mt-3 text-sm text-muted-foreground">
          You don&apos;t have permission to view projects.
        </p>
      </div>
    );
  }

  const activeProjects = projects.filter((project) => project.isActive);
  const archivedProjects = projects.filter((project) => !project.isActive);
  const visibleProjects = tab === "active" ? activeProjects : archivedProjects;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
          Projects
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage projects and assign team members.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "active" | "archived")}
      >
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedProjects.length})
            </TabsTrigger>
          </TabsList>
          {canManage && (
            <Button
              size="sm"
              className="bg-[#4263A3] text-white hover:bg-[#344F85]"
              onClick={() => setProjectDialog({ mode: "create" })}
            >
              <Plus /> Add project
            </Button>
          )}
        </div>

        <TabsContent value={tab} className="pt-2">
          <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
            <div className="flex items-center gap-2 border-b border-[#E1E6ED] px-2 py-2">
              <FolderKanban className="size-5 text-[#4263A3]" />
              <h2 className="text-base font-semibold text-[#18202F]">
                {tab === "active" ? "Active projects" : "Archived projects"}
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProjects.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 5 : 4}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {tab === "active"
                        ? "No active projects yet."
                        : "No archived projects."}
                    </TableCell>
                  </TableRow>
                )}
                {visibleProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <p className="font-medium text-[#18202F]">
                        {project.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {project.description && (
                          <span className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="size-4 text-[#596273]" />
                        {project.memberCount > 0
                          ? `${project.memberCount} member${project.memberCount === 1 ? "" : "s"}`
                          : "Unassigned"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.reportCount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.isActive ? "outline" : "secondary"}
                        className={
                          project.isActive
                            ? "border-transparent bg-[#3C8C7A]/10 text-[#3C8C7A]"
                            : ""
                        }
                      >
                        {project.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberDialog({ project })}
                            aria-label={`Assign members to ${project.name}`}
                          >
                            <UserPlus />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setProjectDialog({ mode: "edit", project })
                            }
                            aria-label={`Edit ${project.name}`}
                          >
                            <Pencil />
                          </Button>
                          {project.isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchive(project)}
                              aria-label={`Archive ${project.name}`}
                            >
                              <Archive />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestore(project)}
                                aria-label={`Restore ${project.name}`}
                              >
                                <RotateCcw />
                              </Button>
                              <Button
                                variant="ghostDestructive"
                                size="icon"
                                onClick={() => handleDelete(project)}
                                aria-label={`Delete ${project.name}`}
                              >
                                <Trash2 />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {projectDialog && (
        <ProjectDialog
          state={projectDialog}
          onClose={() => setProjectDialog(null)}
          onSaved={refresh}
        />
      )}

      {memberDialog && (
        <MembersDialog
          state={memberDialog}
          onClose={() => setMemberDialog(null)}
          onSaved={refresh}
        />
      )}

      {confirmNode}
    </div>
  );
}
