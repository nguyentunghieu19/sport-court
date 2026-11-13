import { createContext, useContext } from "react";
import type { LoginMode, RegisterCustomerRequest, RegisterOwnerRequest, UserSession } from "../types/auth";

export interface AuthContextValue {
  session: UserSession | null;
  login: (identifier: string, password: string, mode?: LoginMode) => Promise<void>;
  registerCustomer: (request: RegisterCustomerRequest) => Promise<void>;
  registerOwner: (request: RegisterOwnerRequest) => Promise<void>;
  logout: () => void;
  updateFullName: (fullName: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}
