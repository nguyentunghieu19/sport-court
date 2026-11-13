import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./authContext";
import { roleHome } from "./authNavigation";

export function RequireCustomer() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) {
    const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/login?mode=customer&returnTo=${returnTo}`} replace />;
  }
  if (session.role !== "USER") return <Navigate to={roleHome(session.role)} replace />;
  // Remount private screens if another tab switches to a different customer.
  return <Outlet key={session.userId} />;
}
