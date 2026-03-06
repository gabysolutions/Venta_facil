import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Permission } from "../context/AuthContext";

type ProtectedRouteProps = {
  requiredPermission?: Permission;
};

export default function ProtectedRoute({ requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, ready, hasPermission } = useAuth();

  if (!ready) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}