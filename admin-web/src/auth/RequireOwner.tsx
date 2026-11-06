import { Navigate, Outlet, useOutletContext } from "react-router";
import { useAuth } from "./authContext";

/**
 * Route guard chỉ cho phép tài khoản có vai trò OWNER truy cập.
 * Nếu là STAFF thì chuyển hướng về trang /bookings.
 * Chuyển tiếp context (breadcrumb, layout context) từ AdminLayout xuống các component con.
 */
export function RequireOwner() {
  const { session } = useAuth();
  const context = useOutletContext();

  if (session?.role !== "OWNER") {
    return <Navigate to="/bookings" replace />;
  }

  return <Outlet context={context} />;
}

