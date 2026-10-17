import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/authService";
import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./authContext";
import { clearSession, getSession, saveSession } from "./sessionStore";

// Các vai trò được vào trang quản trị (sẽ thêm STAFF khi làm phần nhân viên)
const ALLOWED_ROLES = ["OWNER"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => getSession());

  const login = useCallback(async (identifier: string, password: string) => {
    const auth = await authService.login({ identifier, password });
    if (!ALLOWED_ROLES.includes(auth.role)) {
      throw new Error("Tài khoản này không có quyền truy cập trang quản trị");
    }
    setSession(saveSession(auth));
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
