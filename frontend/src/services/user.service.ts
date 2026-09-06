import { api } from "@/lib/api";
import type { Role } from "./auth.service";

export type ManageUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  roles: Role[];
};

export type ManagedRole = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  userCount: number;
  permissions: Permission[];
};

export type Permission = {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
  isAdminLocked?: boolean;
};

export type CreateUserInput = {
  name: string;
  email: string;
  username: string;
  password: string;
  roleIds: string[];
};

export type UpdateUserInput = {
  name?: string;
  isActive?: boolean;
  roleIds?: string[];
  password?: string;
};

export type CreateRoleInput = {
  name: string;
  key: string;
  description?: string;
  permissionIds: string[];
};

export type UpdateRoleInput = {
  name?: string;
  description?: string;
  permissionIds?: string[];
};

export function getUsers(scope: "manage" | "members" = "members") {
  return api.get<ManageUser[]>(`/api/users?scope=${scope}`);
}

export function createUser(data: CreateUserInput) {
  return api.post<ManageUser>("/api/users", data);
}

export function updateUser(id: string, data: UpdateUserInput) {
  return api.patch<ManageUser>(`/api/users/${id}`, data);
}

export function deleteUser(id: string) {
  return api.delete(`/api/users/${id}`);
}

export function getRoles() {
  return api.get<ManagedRole[]>("/api/roles");
}

export function createRole(data: CreateRoleInput) {
  return api.post<ManagedRole>("/api/roles", data);
}

export function updateRole(id: string, data: UpdateRoleInput) {
  return api.patch<ManagedRole>(`/api/roles/${id}`, data);
}

export function deleteRole(id: string) {
  return api.delete(`/api/roles/${id}`);
}

export function getPermissions() {
  return api.get<Permission[]>("/api/roles/permissions");
}

export function getAssignments() {
  return api.get<{ roles: ManagedRole[]; permissions: Permission[] }>(
    "/api/roles/assignments",
  );
}

export function updateRolePermissions(id: string, permissionIds: string[]) {
  return api.patch<ManagedRole>(`/api/roles/${id}/permissions`, { permissionIds });
}

export type CreatePermissionInput = {
  name: string;
  key: string;
  module: string;
  description?: string;
};

export type UpdatePermissionInput = {
  name?: string;
  key?: string;
  module?: string;
  description?: string;
};

export function createPermission(data: CreatePermissionInput) {
  return api.post<Permission>("/api/permissions", data);
}

export function updatePermission(id: string, data: UpdatePermissionInput) {
  return api.patch<Permission>(`/api/permissions/${id}`, data);
}

export function deletePermission(id: string) {
  return api.delete(`/api/permissions/${id}`);
}
