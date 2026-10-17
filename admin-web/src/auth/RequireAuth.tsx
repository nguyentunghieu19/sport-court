import { Navigate, Outlet } from "react-router";
import { useAuth } from "./authContext";

export function RequireAuth() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
