import { api } from "@/lib/api";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  memberCount: number;
  memberUsernames: string[];
  reportCount: number;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

export type ProjectDetail = Project & {
  members: ProjectMember[];
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export function getProjects(options?: { mine?: boolean }) {
  const query = options?.mine ? "?mine=1" : "";
  return api.get<Project[]>(`/api/projects${query}`);
}

export function getProject(id: string) {
  return api.get<ProjectDetail>(`/api/projects/${id}`);
}

export function createProject(data: CreateProjectInput) {
  return api.post<ProjectDetail>("/api/projects", data);
}

export function updateProject(id: string, data: UpdateProjectInput) {
  return api.patch<ProjectDetail>(`/api/projects/${id}`, data);
}

export function archiveProject(id: string) {
  return api.delete(`/api/projects/${id}`);
}

export function deleteProject(id: string) {
  return api.delete(`/api/projects/${id}/permanent`);
}

export function setProjectMembers(id: string, userIds: string[]) {
  return api.put<ProjectDetail>(`/api/projects/${id}/members`, { userIds });
}