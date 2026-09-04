import { api } from "@/lib/api";

export type User = {
  id: string;
  email: string;
  username: string;
  name: string;
  isActive: boolean;
};

export type Role = {
  id: string;
  key: string;
  name: string;
  permissions: string[];
};

export type AuthResponse = {
  user: User;
  roles: Role[];
};

export type RegisterInput = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export function login(identifier: string, password: string) {
  return api.post<AuthResponse>("/api/auth/login", { identifier, password });
}

export function register(data: RegisterInput) {
  return api.post<AuthResponse>("/api/auth/register", data);
}

export function logout() {
  return api.post<{ message: string }>("/api/auth/logout");
}

export function getMe() {
  return api.get<AuthResponse>("/api/auth/me");
}
