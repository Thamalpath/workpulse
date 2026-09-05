"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCheck,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FullPageLoader } from "@/components/loader";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  getPermissions,
  getRoles,
  updateRole,
  type ManagedRole,
  type Permission,
} from "@/services/user.service";

function groupPermissions(permissions: Permission[]): [string, Permission[]][] {
  const map = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const list = map.get(permission.module) ?? [];
    list.push(permission);
    map.set(permission.module, list);
  }
  return Array.from(map.entries());
}

export default function RolePermissionsPage() {
  const { permissions } = useAuth();
  const canViewRoles = permissions.includes("role.view");
  const canAssign = permissions.includes("role.update");

  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [permissionList, setPermissionList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [roleData, permissionData] = await Promise.all([
      getRoles(),
      getPermissions(),
    ]);
    setRoles(roleData);
    setPermissionList(permissionData);
    return roleData;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh]);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  // Sync the working selection whenever the selected role changes.
  useEffect(() => {
    if (!selectedRole) {
      setSelectedPerms(new Set());
      return;
    }
    setSelectedPerms(new Set(selectedRole.permissions.map((p) => p.id)));
  }, [selectedRole]);

  const originalPermIds = useMemo(
    () => new Set((selectedRole?.permissions ?? []).map((p) => p.id)),
    [selectedRole]
  );
  const isDirty =
    selectedPerms.size !== originalPermIds.size ||
    Array.from(selectedPerms).some((id) => !originalPermIds.has(id));

  const groupedPermissions = useMemo(
    () => groupPermissions(permissionList),
    [permissionList]
  );

  const locked = !!selectedRole && selectedRole.key === "admin";

  function togglePermission(permissionId: string) {
    if (locked) return;
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  function toggleModule(module: string, list: Permission[]) {
    if (locked) return;
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      const moduleIds = list.map((p) => p.id);
      const allSelected = moduleIds.every((id) => next.has(id));
      if (allSelected) {
        moduleIds.forEach((id) => next.delete(id));
      } else {
        moduleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleAll() {
    if (locked) return;
    setSelectedPerms((prev) =>
      prev.size === permissionList.length
        ? new Set()
        : new Set(permissionList.map((p) => p.id))
    );
  }

  async function handleSave() {
    if (!selectedRole || !canAssign || locked) return;
    setSaving(true);
    try {
      await updateRole(selectedRole.id, {
        permissionIds: Array.from(selectedPerms),
      });
      toast.success(`Permissions updated for "${selectedRole.name}".`);
      const data = await refresh();
      setSelectedRoleId(selectedRole.id);
      const updated = data.find((role) => role.id === selectedRole.id);
      if (updated) {
        setSelectedPerms(new Set(updated.permissions.map((p) => p.id)));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (!canViewRoles) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <UserCog className="size-10 text-[#596273]" />
        <p className="mt-3 text-sm text-muted-foreground">
          You don&apos;t have permission to view roles.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
          Role Permissions
        </h1>
        <p className="text-sm text-muted-foreground">
          Select a role, then assign or revoke its permissions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
          <div className="flex items-center gap-2 border-b border-[#E1E6ED] px-5 py-4">
            <ShieldCheck className="size-5 text-[#4263A3]" />
            <h2 className="text-base font-semibold text-[#18202F]">Roles</h2>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-2">
            {roles.map((role) => {
              const selected = role.id === selectedRoleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "bg-[#4263A3] text-white"
                      : "text-[#18202F] hover:bg-[#E1E6ED]/60"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{role.name}</span>
                    {role.key === "admin" && (
                      <Lock className={cn("size-3.5", selected ? "text-white/80" : "text-[#2F6B5C]")} />
                    )}
                  </span>
                  <span className={cn("text-xs", selected ? "text-white/80" : "text-muted-foreground")}>
                    {role.key} · {role.permissions.length} permissions · {role.userCount} member{role.userCount === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
          {!selectedRole ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
              <UserCog className="size-10 text-[#596273]/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Select a role from the list to manage its permissions.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-[#E1E6ED] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#4263A3]" />
                  <h2 className="text-base font-semibold text-[#18202F]">
                    {selectedRole.name}
                  </h2>
                  <Badge variant={selectedRole.isSystem ? "default" : "secondary"}>
                    {selectedRole.isSystem ? "System" : "Custom"}
                  </Badge>
                </div>
                {canAssign && (
                  <div className="flex items-center gap-2">
                    {!locked && (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={toggleAll}>
                          <CheckCheck />
                          {selectedPerms.size === permissionList.length
                            ? "Clear all"
                            : "Select all"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-[#4263A3] text-white hover:bg-[#344F85]"
                          onClick={handleSave}
                          disabled={saving || !isDirty}
                        >
                          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save />}
                          Save changes
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {locked && (
                <div className="flex items-start gap-2 border-b border-[#3C8C7A]/20 bg-[#3C8C7A]/10 px-5 py-3 text-sm text-[#2F6B5C]">
                  <Lock className="mt-0.5 size-4 shrink-0" />
                  <p>
                    The Admin role is locked. It always has every permission and
                    they cannot be changed or unassigned.
                  </p>
                </div>
              )}

              {!canAssign && !locked && (
                <div className="border-b border-[#E1E6ED] px-5 py-3 text-sm text-[#C85C5C]">
                  You don&apos;t have permission to update role permissions.
                </div>
              )}

              <div className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selectedPerms.size} of {permissionList.length} permissions selected
                  </p>
                  {!locked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPerms(new Set(originalPermIds))}
                      disabled={!isDirty}
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {groupedPermissions.map(([module, list]) => {
                    const selectedCount = list.filter((p) => selectedPerms.has(p.id)).length;
                    const allChecked = selectedCount === list.length;
                    return (
                      <div
                        key={module}
                        className="rounded-xl border border-[#E1E6ED] p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!locked && (
                              <Checkbox
                                checked={allChecked}
                                onCheckedChange={() => toggleModule(module, list)}
                                aria-label={`Select all in ${module}`}
                              />
                            )}
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3]">
                              {module.replace(".", " ")}
                            </h3>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {selectedCount}/{list.length}
                          </span>
                        </div>
                        <div className="grid gap-1.5">
                          {list.map((permission) => (
                            <label
                              key={permission.id}
                              className={cn(
                                "flex items-start gap-2 rounded-md px-1 py-1 text-sm",
                                locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#F5F7FA]"
                              )}
                            >
                              <Checkbox
                                checked={
                                  locked ? true : selectedPerms.has(permission.id)
                                }
                                onCheckedChange={() => togglePermission(permission.id)}
                                disabled={locked}
                              />
                              <span>
                                <span className="font-medium text-[#18202F]">
                                  {permission.name}
                                </span>
                                {permission.description && (
                                  <span className="block text-xs text-muted-foreground">
                                    {permission.description}
                                  </span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}