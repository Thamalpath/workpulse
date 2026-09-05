"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FullPageLoader } from "@/components/loader";
import { useAuth } from "@/contexts/auth-context";
import { useConfirm } from "@/hooks/use-confirm";
import {
  createPermission,
  deletePermission,
  getPermissions,
  updatePermission,
  type Permission,
} from "@/services/user.service";

const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;

type PermissionDialogState =
  | { mode: "create" }
  | { mode: "edit"; permission: Permission }
  | null;

function PermissionDialog({
  state,
  existingModules,
  onClose,
  onSaved,
}: {
  state: Exclude<PermissionDialogState, null>;
  existingModules: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = state.mode === "edit" ? state.permission : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [key, setKey] = useState(editing?.key ?? "");
  const [module, setModule] = useState(editing?.module ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [errors, setErrors] = useState<{
    name?: string;
    key?: string;
    module?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function clearError(field: keyof typeof errors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validateForm() {
    const next: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedKey = key.trim();
    const trimmedModule = module.trim();

    if (!trimmedName) {
      next.name = "Permission name is required.";
    } else if (trimmedName.length < 2) {
      next.name = "Permission name must be at least 2 characters.";
    }

    if (!editing) {
      if (!trimmedKey) {
        next.key = "Permission key is required.";
      } else if (!PERMISSION_KEY_PATTERN.test(trimmedKey)) {
        next.key =
          'Permission key must be in the form "module.action" (e.g. "report.view").';
      }
    }

    if (!trimmedModule) {
      next.module = "Module is required.";
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const issues = validateForm();
    if (Object.keys(issues).some((k) => issues[k as keyof typeof issues])) {
      setErrors(issues);
      toast.warning("Please fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updatePermission(editing.id, {
          name: name.trim(),
          key: key.trim() || undefined,
          module: module.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await createPermission({
          name: name.trim(),
          key: key.trim(),
          module: module.trim(),
          description: description.trim() || undefined,
        });
      }
      toast.success(editing ? "Permission updated." : "Permission created.");
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
          <DialogTitle>{editing ? "Edit permission" : "Add permission"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the permission details."
              : "Create a new permission. It is automatically assigned to the Admin role."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="permission-name">Name</Label>
            <Input
              id="permission-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              placeholder="e.g. View Reports"
              aria-invalid={errors.name ? true : undefined}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-[#C85C5C]" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="permission-key">Key</Label>
              <Input
                id="permission-key"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  clearError("key");
                }}
                placeholder="e.g. report.view"
                disabled={!!editing}
                aria-invalid={errors.key ? true : undefined}
              />
              {errors.key && (
                <p className="text-xs text-[#C85C5C]" role="alert">
                  {errors.key}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="permission-module">Module</Label>
              <Input
                id="permission-module"
                value={module}
                onChange={(e) => {
                  setModule(e.target.value);
                  clearError("module");
                }}
                placeholder="e.g. Reports"
                list="permission-modules"
                aria-invalid={errors.module ? true : undefined}
              />
              <datalist id="permission-modules">
                {existingModules.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {errors.module && (
                <p className="text-xs text-[#C85C5C]" role="alert">
                  {errors.module}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="permission-description">Description (optional)</Label>
            <Textarea
              id="permission-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this permission grant?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create permission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PermissionsPage() {
  const { permissions } = useAuth();
  const canView = permissions.includes("permission.view");
  const canCreate = permissions.includes("permission.create");
  const canUpdate = permissions.includes("permission.update");
  const canDelete = permissions.includes("permission.delete");

  const [permissionList, setPermissionList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dialog, setDialog] = useState<PermissionDialogState>(null);
  const [confirm, confirmNode] = useConfirm();

  const refresh = useCallback(async () => {
    const data = await getPermissions();
    setPermissionList(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh]);

  const modules = useMemo(() => {
    return Array.from(
      new Set(permissionList.map((p) => p.module).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [permissionList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return permissionList.filter((permission) => {
      if (moduleFilter !== "all" && permission.module !== moduleFilter) return false;
      if (!q) return true;
      return [
        permission.key,
        permission.name,
        permission.module,
        permission.description ?? "",
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [permissionList, query, moduleFilter]);

  async function handleDelete(permission: Permission) {
    if (!(await confirm({
      title: "Delete permission",
      message: `Delete the "${permission.key}" permission? This removes it from every role except the Admin role, which cannot be changed.`,
      destructive: true,
      confirmLabel: "Delete",
    }))) return;
    try {
      await deletePermission(permission.id);
      toast.success("Permission deleted.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete permission.");
    }
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (!canView) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <ShieldEllipsis className="size-10 text-[#596273]" />
        <p className="mt-3 text-sm text-muted-foreground">
          You don&apos;t have permission to view permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
          Permissions
        </h1>
        <p className="text-sm text-muted-foreground">
          Create, search, update, and delete permissions used across the system.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E1E6ED] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#4263A3]" />
            <h2 className="text-base font-semibold text-[#18202F]">
              All permissions
            </h2>
            <Badge variant="outline" className="ml-1">{permissionList.length}</Badge>
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="bg-[#4263A3] text-white hover:bg-[#344F85]"
              onClick={() => setDialog({ mode: "create" })}
            >
              <Plus /> Add permission
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 border-b border-[#E1E6ED] px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, key, module…"
              className="pl-9"
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Admin</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <KeyRound className="mx-auto size-8 text-[#596273]/60" />
                  <p className="mt-2 text-sm">
                    {query || moduleFilter !== "all"
                      ? "No permissions match your filters."
                      : "No permissions found."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <p className="font-medium text-[#18202F]">{permission.name}</p>
                    {permission.description && (
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-[#F5F7FA] px-1.5 py-0.5 text-xs text-[#596273]">
                      {permission.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{permission.module}</Badge>
                  </TableCell>
                  <TableCell>
                    {permission.isAdminLocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2F6B5C]">
                        <Lock className="size-3.5" /> Locked
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDialog({ mode: "edit", permission })
                            }
                            aria-label={`Edit ${permission.key}`}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghostDestructive"
                            size="icon"
                            disabled={permission.isAdminLocked}
                            title={
                              permission.isAdminLocked
                                ? "This permission is required by the Admin role and cannot be deleted."
                                : `Delete ${permission.key}`
                            }
                            onClick={() => handleDelete(permission)}
                            aria-label={`Delete ${permission.key}`}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {dialog && (
        <PermissionDialog
          state={dialog}
          existingModules={modules}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}

      {confirmNode}
    </div>
  );
}