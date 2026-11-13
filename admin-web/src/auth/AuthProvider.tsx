import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/authService";
import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./authContext";
import { clearSession, getSession, saveSession, updateSessionFullName } from "./sessionStore";
import type { LoginMode, RegisterCustomerRequest, RegisterOwnerRequest } from "../types/auth";

const ALLOWED_ROLES = ["USER", "ADMIN", "OWNER", "STAFF"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => {
    const saved = getSession();
    if (saved && !ALLOWED_ROLES.includes(saved.role)) {
      clearSession();
      return null;
    }
    return saved;
  });

  const login = useCallback(async (identifier: string, password: string, mode?: LoginMode) => {
    const auth = await authService.login({ identifier, password });
    if (!ALLOWED_ROLES.includes(auth.role)) {
      throw new Error("Vai trò tài khoản không được hỗ trợ.");
    }
    if (mode === "customer" && auth.role !== "USER") {
      throw new Error("Đây là tài khoản quản lý. Vui lòng chọn “Chủ sân / Admin / Nhân viên” để đăng nhập.");
    }
    if (mode === "management" && auth.role === "USER") {
      throw new Error("Đây là tài khoản người dùng. Vui lòng chọn “Người dùng” để đăng nhập.");
    }
    setSession(saveSession(auth));
  }, []);

  const registerCustomer = useCallback(async (request: RegisterCustomerRequest) => {
    const auth = await authService.registerCustomer(request);
    if (auth.role !== "USER") throw new Error("Không thể tạo tài khoản người dùng. Vui lòng thử lại.");
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

  const updateFullName = useCallback((fullName: string) => {
    setSession(updateSessionFullName(fullName));
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(logout, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session, logout]);

  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, registerCustomer, registerOwner, logout, updateFullName }),
    [session, login, registerCustomer, registerOwner, logout, updateFullName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
