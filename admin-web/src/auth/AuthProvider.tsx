import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/authService";
import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./authContext";
import { clearSession, getSession, saveSession } from "./sessionStore";
import type { RegisterOwnerRequest } from "../types/auth";

// Các vai trò được vào trang quản trị (Chủ sân và Nhân viên)
const ALLOWED_ROLES = ["OWNER", "STAFF"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => getSession());

  const login = useCallback(async (identifier: string, password: string) => {
    const auth = await authService.login({ identifier, password });
    if (!ALLOWED_ROLES.includes(auth.role)) {
      throw new Error("Tài khoản này không có quyền truy cập trang quản trị");
    }
    setSession(saveSession(auth));
  }, []);

  const registerOwner = useCallback(async (request: RegisterOwnerRequest) => {
    const auth = await authService.registerOwner(request);
    if (auth.role !== "OWNER") {
      throw new Error("Tài khoản chưa được cấp quyền chủ sân. Vui lòng liên hệ quản trị viên.");
    }
    setSession(saveSession(auth));
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, registerOwner, logout }),
    [session, login, registerOwner, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
