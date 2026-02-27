import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getPrivilegesByUserId } from "../services/privileges.service";
import type { PrivilegeKey } from "../services/privileges.service";

export type Role = "ADMIN" | "CAJERA";
export type Permission = PrivilegeKey;

export type User = {
  id: string; // viene como string
  name: string;
  role: Role;
  permissions: Permission[];
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: { user: User; token?: string; remember?: boolean }) => void;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasPermission: (perm: Permission) => boolean;
  getToken: () => string | null;
  refreshPermissions: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const LS_USER = "vf_user";
const LS_TOKEN = "vf_token";

function clearAuthStorage() {
  localStorage.removeItem(LS_USER);
  localStorage.removeItem(LS_TOKEN);
  sessionStorage.removeItem(LS_USER);
  sessionStorage.removeItem(LS_TOKEN);

  // por si traías llaves viejas
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("permissions");
}

function readAuthFromStorage() {
  const ssUser = sessionStorage.getItem(LS_USER);
  const ssToken = sessionStorage.getItem(LS_TOKEN);
  const lsUser = localStorage.getItem(LS_USER);
  const lsToken = localStorage.getItem(LS_TOKEN);

  return {
    rawUser: ssUser || lsUser,
    rawToken: ssToken || lsToken,
    preferSession: !!ssToken || (!!ssUser && !lsToken),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const getToken = () => token || sessionStorage.getItem(LS_TOKEN) || localStorage.getItem(LS_TOKEN);

  const persistUser = (nextUser: User) => {
    const inSession = !!sessionStorage.getItem(LS_TOKEN);
    const storage = inSession ? sessionStorage : localStorage;
    storage.setItem(LS_USER, JSON.stringify(nextUser));
  };

  const refreshPermissions = async () => {
    const t = getToken();
    if (!t) return;
    if (!user) return;

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) return;

    const res = await getPrivilegesByUserId(userId);
    if (!res.success || !res.data) return;

    const perms = (res.data.permissions ?? []).map((p) => p.key) as Permission[];
    const nextUser: User = { ...user, permissions: perms };

    setUser(nextUser);
    persistUser(nextUser);
  };

  useEffect(() => {
    const { rawUser, rawToken } = readAuthFromStorage();

    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        clearAuthStorage();
        setUser(null);
        setToken(null);
        return;
      }
    }

    if (rawToken) setToken(rawToken);
  }, []);

  // cuando haya token+user, trae permisos reales
  useEffect(() => {
    if (!user) return;
    if (!getToken()) return;

    refreshPermissions().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  const login: AuthState["login"] = ({ user: incomingUser, token: incomingToken, remember = true }) => {
    clearAuthStorage();

    setUser(incomingUser);
    if (incomingToken) setToken(incomingToken);

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(LS_USER, JSON.stringify(incomingUser));
    if (incomingToken) storage.setItem(LS_TOKEN, incomingToken);

    // después del login, trae permisos reales (con userId)
    if (incomingToken) {
      (async () => {
        try {
          const userId = Number(incomingUser.id);
          if (!Number.isFinite(userId)) return;

          const res = await getPrivilegesByUserId(userId);
          if (!res.success || !res.data) return;

          const perms = (res.data.permissions ?? []).map((p) => p.key) as Permission[];
          const nextUser: User = { ...incomingUser, permissions: perms };

          setUser(nextUser);
          storage.setItem(LS_USER, JSON.stringify(nextUser));
        } catch {
          // si falla, te quedas con lo que venía en login
        }
      })();
    }
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setToken(null);
  };

  const hasRole = (role: Role) => user?.role === role;
  const hasPermission = (perm: Permission) => !!user?.permissions?.includes(perm);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!getToken(),
      login,
      logout,
      hasRole,
      hasPermission,
      getToken,
      refreshPermissions,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}