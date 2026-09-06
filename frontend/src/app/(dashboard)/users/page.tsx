"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ListChecks,
  Loader2,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

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
import { ApiError } from "@/lib/api";
import {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getPermissions,
  getRoles,
  getUsers,
  updateRole,
  updateUser,
  type ManagedRole,
  type ManageUser,
  type Permission,
} from "@/services/user.service";

type UserDialogState =
  | { mode: "create" }
  | { mode: "edit"; user: ManageUser }
  | null;

type RoleDialogState =
  | { mode: "create" }
  | { mode: "edit"; role: ManagedRole }
  | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ROLE_KEY_PATTERN = /^[a-z][a-z0-9-]*$/;

function UserDialog({
  state,
  roles,
  onClose,
  onSaved,
}: {
  state: Exclude<UserDialogState, null>;
  roles: ManagedRole[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = state.mode === "edit" ? state.user : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [username, setUsername] = useState(editing?.username ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    editing?.roles.map((role) => role.id) ?? [],
  );
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    username?: string;
    password?: string;
    roles?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function clearError(field: keyof typeof errors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function toggleRole(roleId: string) {
    setSelectedRoles((prev) => {
      const next = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];
      if (next.length > 0) clearError("roles");
      return next;
    });
  }

  function validateForm() {
    const next: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName) {
      next.name = "Name is required.";
    } else if (trimmedName.length < 2) {
      next.name = "Name must be at least 2 characters.";
    }

    if (editing) {
      if (password && password.length < 6) {
        next.password = "Password must be at least 6 characters.";
      }
    } else {
      if (!trimmedEmail) {
        next.email = "Email is required.";
      } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
        next.email = "Please provide a valid email address.";
      }
      if (!trimmedUsername) {
        next.username = "Username is required.";
      } else if (trimmedUsername.length < 3) {
        next.username = "Username must be at least 3 characters.";
      } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
        next.username =
          "Username can only contain letters, numbers, dashes and underscores.";
      }
      if (!password) {
        next.password = "Password is required.";
      } else if (password.length < 6) {
        next.password = "Password must be at least 6 characters.";
      }
    }

    if (selectedRoles.length === 0) {
      next.roles = "Select at least one role.";
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const issues = validateForm();
    if (Object.keys(issues).some((k) => issues[k as keyof typeof issues])) {
      setErrors(issues);
      toast.warning("Please fill the required fields.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.id, {
          name: name.trim(),
          isActive,
          roleIds: selectedRoles,
          password: password || undefined,
        });
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
          roleIds: selectedRoles,
        });
      }
      toast.success(editing ? "User updated." : "User created.");
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
          <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this team member's details and roles."
              : "Create a new team member and assign roles."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
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
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                value={username}
                disabled={!!editing}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError("username");
                }}
                aria-invalid={errors.username ? true : undefined}
              />
              {errors.username && (
                <p className="text-xs text-[#C85C5C]" role="alert">
                  {errors.username}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              disabled={!!editing}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={errors.email ? true : undefined}
            />
            {errors.email && (
              <p className="text-xs text-[#C85C5C]" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              {editing ? "New password (optional)" : "Password"}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              placeholder={
                editing
                  ? "Leave blank to keep the current password"
                  : "At least 6 characters"
              }
              aria-invalid={errors.password ? true : undefined}
            />
            {errors.password && (
              <p className="text-xs text-[#C85C5C]" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const checked = selectedRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      checked
                        ? "border-[#4263A3] bg-[#4263A3] text-white"
                        : "border-[#E1E6ED] bg-white text-[#596273] hover:border-[#4263A3]/40"
                    }`}
                    aria-pressed={checked}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
            {errors.roles && (
              <p className="text-xs text-[#C85C5C]" role="alert">
                {errors.roles}
              </p>
            )}
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={setIsActive} />
              Active
            </label>
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
              {editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({
  state,
  permissions,
  onClose,
  onSaved,
}: {
  state: Exclude<RoleDialogState, null>;
  permissions: Permission[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = state.mode === "edit" ? state.role : null;
  const locked = !!editing && editing.key === "admin";
  const [name, setName] = useState(editing?.name ?? "");
  const [key, setKey] = useState(editing?.key ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(
      state.mode === "edit"
        ? state.role.permissions.map((permission) => permission.id)
        : [],
    ),
  );
  const [errors, setErrors] = useState<{ name?: string; key?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const list = map.get(permission.module) ?? [];
      list.push(permission);
      map.set(permission.module, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  function clearError(field: keyof typeof errors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function togglePermission(permissionId: string) {
    if (locked) return;
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  function validateForm() {
    const next: typeof errors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      next.name = "Role name is required.";
    } else if (trimmedName.length < 2) {
      next.name = "Role name must be at least 2 characters.";
    }

    if (!editing) {
      const trimmedKey = key.trim();
      if (!trimmedKey) {
        next.key = "Role key is required.";
      } else if (trimmedKey.length < 3) {
        next.key = "Role key must be at least 3 characters.";
      } else if (!ROLE_KEY_PATTERN.test(trimmedKey)) {
        next.key =
          "Role key must start with a letter and only contain lowercase letters, numbers and dashes.";
      }
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const issues = validateForm();
    if (Object.keys(issues).some((k) => issues[k as keyof typeof issues])) {
      setErrors(issues);
      toast.warning("Please fill the required fields.");
      return;
    }

    setSaving(true);
    const permissionIds = locked ? undefined : Array.from(selectedPermissions);
    try {
      if (editing) {
        await updateRole(editing.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissionIds,
        });
      } else {
        await createRole({
          name: name.trim(),
          key: key.trim(),
          description: description.trim() || undefined,
          permissionIds: Array.from(selectedPermissions),
        });
      }
      toast.success(editing ? "Role updated." : "Role created.");
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the role name and its permissions."
              : "Define a new role and choose its permissions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

          {locked && (
            <div className="flex items-start gap-2 rounded-lg border border-[#3C8C7A]/30 bg-[#3C8C7A]/10 p-3 text-sm text-[#2F6B5C]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>
                The Admin role is locked and always has all permissions. They
                cannot be changed or unassigned.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
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
              <Label htmlFor="role-key">Key</Label>
              <Input
                id="role-key"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  clearError("key");
                }}
                placeholder="e.g. auditor"
                disabled={!!editing}
                aria-invalid={errors.key ? true : undefined}
              />
              {errors.key && (
                <p className="text-xs text-[#C85C5C]" role="alert">
                  {errors.key}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              {!locked && typeof selectedPermissions !== "undefined" && (
                <span className="text-xs text-muted-foreground">
                  {selectedPermissions.size} of {permissions.length} selected
                </span>
              )}
              {locked && (
                <span className="text-xs font-medium text-[#2F6B5C]">
                  {permissions.length} of {permissions.length} (locked)
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {grouped.map(([module, list]) => (
                <div
                  key={module}
                  className="rounded-lg border border-[#E1E6ED] p-3"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4263A3]">
                    {module.replace(".", " ")}
                  </p>
                  <div className="grid gap-1.5">
                    {list.map((permission) => (
                      <label
                        key={permission.id}
                        className={`flex items-center gap-2 text-sm ${
                          locked ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        <Checkbox
                          checked={
                            locked
                              ? true
                              : selectedPermissions.has(permission.id)
                          }
                          onCheckedChange={() =>
                            togglePermission(permission.id)
                          }
                          disabled={locked}
                        />
                        {permission.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              {editing ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const { permissions, hasRole, roles: myRoles, isLoading: authLoading } = useAuth();
  const isAdmin = hasRole("admin");
  const canViewUsers = permissions.includes("user.view");
  const canViewRoles = permissions.includes("role.view");
  const canCreateUsers = permissions.includes("user.create");
  const canUpdateUsers = permissions.includes("user.update");
  const canDeleteUsers = permissions.includes("user.delete");
  const canCreateRoles = permissions.includes("role.create");
  const canUpdateRoles = permissions.includes("role.update");
  const canDeleteRoles = permissions.includes("role.delete");

  const [users, setUsers] = useState<ManageUser[]>([]);
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [permissionList, setPermissionList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDialog, setUserDialog] = useState<UserDialogState>(null);
  const [roleDialog, setRoleDialog] = useState<RoleDialogState>(null);
  const [confirm, confirmNode] = useConfirm();
  const fetchedOnce = useRef(false);

  const refresh = useCallback(async () => {
    const [userData, roleData, permissionData] = await Promise.all([
      canViewUsers ? getUsers("manage") : Promise.resolve([]),
      canViewRoles ? getRoles() : Promise.resolve([]),
      canViewRoles ? getPermissions() : Promise.resolve([]),
    ]);
    setUsers(userData);
    setRoles(roleData);
    setPermissionList(permissionData);
  }, [canViewUsers, canViewRoles]);

  useEffect(() => {
    if (authLoading || fetchedOnce.current) {
      return;
    }
    fetchedOnce.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [authLoading, refresh]);

  const myRoleKeys = useMemo(
    () => new Set(myRoles.map((role) => role.key)),
    [myRoles],
  );
  const visibleRoles = useMemo(
    () =>
      isAdmin
        ? roles
        : roles.filter(
            (role) =>
              role.key !== "admin" && !myRoleKeys.has(role.key),
          ),
    [isAdmin, roles, myRoleKeys],
  );

  async function handleDeleteUser(user: ManageUser) {
    if (
      !(await confirm({
        title: "Delete user",
        message: `Delete ${user.name}? This cannot be undone.`,
        destructive: true,
        confirmLabel: "Delete",
      }))
    )
      return;
    try {
      await deleteUser(user.id);
      toast.success("User deleted.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete user.",
      );
    }
  }

  async function handleDeleteRole(role: ManagedRole) {
    if (
      !(await confirm({
        title: "Delete role",
        message: `Delete the "${role.name}" role? This cannot be undone.`,
        destructive: true,
        confirmLabel: "Delete",
      }))
    )
      return;
    try {
      await deleteRole(role.id);
      toast.success("Role deleted.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete role.",
      );
    }
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (!canViewUsers && !canViewRoles) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <UserCog className="size-10 text-[#596273]" />
        <p className="mt-3 text-sm text-muted-foreground">
          You don&apos;t have permission to view user management.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage team members, roles, permissions, and role assignments.
        </p>
      </div>

      <Tabs defaultValue={canViewUsers ? "users" : "roles"}>
        <TabsList>
          {canViewUsers && <TabsTrigger value="users">Users</TabsTrigger>}
          {canViewRoles && <TabsTrigger value="roles">Roles</TabsTrigger>}
        </TabsList>

        {canViewUsers && (
          <TabsContent value="users" className="pt-4">
            <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
              <div className="flex items-center justify-between border-b border-[#E1E6ED] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-[#4263A3]" />
                  <h2 className="text-base font-semibold text-[#18202F]">
                    Team members
                  </h2>
                </div>
                {canCreateUsers && (
                  <Button
                    size="sm"
                    className="bg-[#4263A3] text-white hover:bg-[#344F85]"
                    onClick={() => setUserDialog({ mode: "create" })}
                  >
                    <Plus /> Add user
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    {canUpdateUsers && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium text-[#18202F]">
                          {user.name}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="size-3" />
                          {user.email}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "outline" : "destructive"}
                          className={
                            user.isActive
                              ? "border-transparent bg-[#3C8C7A]/10 text-[#3C8C7A]"
                              : ""
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {canUpdateUsers && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setUserDialog({ mode: "edit", user })
                              }
                              aria-label={`Edit ${user.name}`}
                            >
                              <Pencil />
                            </Button>
                            {canDeleteUsers && (
                              <Button
                                variant="ghostDestructive"
                                size="icon"
                                onClick={() => handleDeleteUser(user)}
                                aria-label={`Delete ${user.name}`}
                              >
                                <Trash2 />
                              </Button>
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
        )}

        {canViewRoles && (
          <TabsContent value="roles" className="pt-4">
            <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#E1E6ED] px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#4263A3]" />
                  <h2 className="text-base font-semibold text-[#18202F]">
                    Roles
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {canUpdateRoles && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/assign-permissions">
                        <ListChecks /> Assign permissions
                      </Link>
                    </Button>
                  )}
                  {canCreateRoles && (
                    <Button
                      size="sm"
                      className="bg-[#4263A3] text-white hover:bg-[#344F85]"
                      onClick={() => setRoleDialog({ mode: "create" })}
                    >
                      <Plus /> Add role
                    </Button>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Members</TableHead>
                    {(canUpdateRoles || canDeleteRoles) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium text-[#18202F]">
                        {role.name}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-[#F5F7FA] px-1.5 py-0.5 text-xs text-[#596273]">
                          {role.key}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.permissions.length} permissions
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.userCount}
                      </TableCell>
                      {(canUpdateRoles || canDeleteRoles) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdateRoles && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setRoleDialog({ mode: "edit", role })
                                }
                                aria-label={`Edit ${role.name}`}
                              >
                                <Pencil />
                              </Button>
                            )}
                            {canDeleteRoles && (
                              <Button
                                variant="ghostDestructive"
                                size="icon"
                                onClick={() => handleDeleteRole(role)}
                                aria-label={`Delete ${role.name}`}
                              >
                                <Trash2 />
                              </Button>
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
        )}
      </Tabs>

      {userDialog && (
        <UserDialog
          state={userDialog}
          roles={visibleRoles}
          onClose={() => setUserDialog(null)}
          onSaved={refresh}
        />
      )}

      {roleDialog && (
        <RoleDialog
          state={roleDialog}
          permissions={permissionList}
          onClose={() => setRoleDialog(null)}
          onSaved={refresh}
        />
      )}

      {confirmNode}
    </div>
  );
}
