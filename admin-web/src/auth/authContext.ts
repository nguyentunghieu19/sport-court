import { createContext, useContext } from "react";
import type { UserSession } from "../types/auth";

export interface AuthContextValue {
  session: UserSession | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}
