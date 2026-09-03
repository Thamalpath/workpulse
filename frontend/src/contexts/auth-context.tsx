"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const data = await getMe();
        if (!active) return;
        applySession(data);
      } catch {
        if (!active) return;
        setUser(null);
        setRoles([]);
        setPermissions([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  function applySession(data: AuthResponse) {
    setUser(data.user);
    setRoles(data.roles);
    setPermissions(
      Array.from(new Set(data.roles.flatMap((role) => role.permissions)))
    );
  }

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
    setUser(null);
    setRoles([]);
    setPermissions([]);
  }, []);

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
