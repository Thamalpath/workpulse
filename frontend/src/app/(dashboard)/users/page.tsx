"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
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

function PermissionsView({
  permissions,
}: {
  permissions: Permission[];
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const list = map.get(permission.module) ?? [];
      list.push(permission);
      map.set(permission.module, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {grouped.map(([module, list]) => (
        <div
          key={module}
          className="rounded-xl border border-[#E1E6ED] bg-white p-5"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3]">
            {module.replace(".", " ")}
          </h3>
          <ul className="mt-3 space-y-2">
            {list.map((permission) => (
              <li key={permission.id} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#38B8C4]" />
                <div>
                  <p className="text-sm font-medium text-[#18202F]">
                    {permission.name}
                  </p>
                  {permission.description && (
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

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
  const [position, setPosition] = useState(editing?.position ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    editing?.roles.map((role) => role.id) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleRole(roleId: string) {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.id, {
          name,
          position: position || undefined,
          isActive,
          roleIds: selectedRoles,
          password: password || undefined,
        });
      } else {
        await createUser({ name, email, username, password, position, roleIds: selectedRoles });
      }
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
              <Label htmlFor="user-name">Full name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-position">Position</Label>
            <Input
              id="user-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              {editing ? "New password (optional)" : "Password"}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editing}
              minLength={6}
            />
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
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-[#E1E6ED] text-[#4263A3]"
              />
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
  const [name, setName] = useState(editing?.name ?? "");
  const [key, setKey] = useState(editing?.key ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(
      state.mode === "edit"
        ? state.role.permissions.map((permission) => permission.id)
        : []
    )
  );
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

  function togglePermission(permissionId: string) {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const permissionIds = Array.from(selectedPermissions);
    try {
      if (editing) {
        await updateRole(editing.id, {
          name,
          description: description || undefined,
          permissionIds,
        });
      } else {
        await createRole({ name, key, description, permissionIds });
      }
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
          <DialogTitle>{editing ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the role name and its permissions."
              : "Define a new role and choose its permissions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-key">Key</Label>
              <Input
                id="role-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. auditor"
                disabled={!!editing}
                required
              />
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
            <Label>Permissions</Label>
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
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="size-4 rounded border-[#E1E6ED] text-[#4263A3]"
                      />
                      {permission.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
  const { permissions } = useAuth();
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

  const refresh = useCallback(async () => {
    const [userData, roleData, permissionData] = await Promise.all([
      canViewUsers ? getUsers() : Promise.resolve([]),
      canViewRoles ? getRoles() : Promise.resolve([]),
      canViewRoles ? getPermissions() : Promise.resolve([]),
    ]);
    setUsers(userData);
    setRoles(roleData);
    setPermissionList(permissionData);
  }, [canViewUsers, canViewRoles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleDeleteUser(user: ManageUser) {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete user.");
    }
  }

  async function handleDeleteRole(role: ManagedRole) {
    if (!window.confirm(`Delete the "${role.name}" role?`)) return;
    try {
      await deleteRole(role.id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Failed to delete role.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4263A3]" />
      </div>
    );
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage team members, roles, and permissions.
        </p>
      </div>

      <Tabs defaultValue={canViewUsers ? "users" : "roles"}>
        <TabsList>
          {canViewUsers && <TabsTrigger value="users">Users</TabsTrigger>}
          {canViewRoles && <TabsTrigger value="roles">Roles</TabsTrigger>}
          {canViewRoles && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
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
                    <TableHead>Position</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    {canUpdateUsers && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium text-[#18202F]">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.position || "—"}
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
                                variant="ghost"
                                size="icon"
                                className="text-[#C85C5C]"
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
              <div className="flex items-center justify-between border-b border-[#E1E6ED] px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#4263A3]" />
                  <h2 className="text-base font-semibold text-[#18202F]">Roles</h2>
                </div>
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>System</TableHead>
                    {(canUpdateRoles || canDeleteRoles) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium text-[#18202F]">
                        {role.name}
                        {role.description && (
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        )}
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
                      <TableCell>
                        <Badge variant={role.isSystem ? "default" : "secondary"}>
                          {role.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      {(canUpdateRoles || canDeleteRoles) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdateRoles && !role.isSystem && (
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
                            {canDeleteRoles && !role.isSystem && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#C85C5C]"
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

        {canViewRoles && (
          <TabsContent value="permissions" className="pt-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#4263A3]" />
              <h2 className="text-base font-semibold text-[#18202F]">
                All permissions
              </h2>
            </div>
            <PermissionsView permissions={permissionList} />
          </TabsContent>
        )}
      </Tabs>

      {userDialog && (
        <UserDialog
          state={userDialog}
          roles={roles}
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
    </div>
  );
}
