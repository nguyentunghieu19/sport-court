import { Navigate, Outlet } from "react-router";
import { useAuth } from "./authContext";
import { roleHome } from "./authNavigation";

export function RequireSystemAdmin() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login?mode=management" replace />;
  if (session.role !== "ADMIN") return <Navigate to={roleHome(session.role)} replace />;
  return <Outlet />;
}

export function RequireOperations() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login?mode=management" replace />;
  if (session.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (session.role !== "OWNER" && session.role !== "STAFF") return <Navigate to="/" replace />;
  return <Outlet />;
}
