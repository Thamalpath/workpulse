"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { AUTH_CONFIG } from "@/config/auth";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthResponse,
  type RegisterInput,
  type Role,
  type User,
} from "@/services/auth.service";

type AuthContextValue = {
  user: User | null;
  roles: Role[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
  hasRole: (roleKey: string) => boolean;
  hasAnyRole: (roleKeys: string[]) => boolean;
  hasPermission: (permissionKey: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionChecked = useRef(false);

  function applySession(data: AuthResponse) {
    setUser(data.user);
    setRoles(data.roles);
    setPermissions(
      Array.from(new Set(data.roles.flatMap((role) => role.permissions))),
    );
  }

  function clearSession() {
    setUser(null);
    setRoles([]);
    setPermissions([]);
  }

  const refreshSession = useCallback(async (): Promise<AuthResponse | null> => {
    try {
      const data = await getMe();
      applySession(data);
      return data;
    } catch {
      clearSession();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session hydration
  useEffect(() => {
    if (!sessionChecked.current) {
      sessionChecked.current = true;
      void refreshSession();
    }
  }, [refreshSession]);

  // Handle global 401 session expiration / revocation
  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
      router.replace(AUTH_CONFIG.routes.login);
    }

    window.addEventListener("workpulse:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("workpulse:unauthorized", handleUnauthorized);
    };
  }, [router]);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await loginRequest(identifier, password);
    applySession(data);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await registerRequest(input);
    applySession(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore network errors on logout; always clear the local session.
    }
    clearSession();
  }, []);

  // RBAC helper utilities
  const hasRole = useCallback(
    (roleKey: string) => {
      return roles.some((r) => r.key === roleKey);
    },
    [roles],
  );

  const hasAnyRole = useCallback(
    (roleKeys: string[]) => {
      return roles.some((r) => roleKeys.includes(r.key));
    },
    [roles],
  );

  const hasPermission = useCallback(
    (permissionKey: string) => {
      return permissions.includes(permissionKey);
    },
    [permissions],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
        hasRole,
        hasAnyRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
