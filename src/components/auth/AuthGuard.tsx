import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  requiredRole: "superadmin" | "company";
}

export default function AuthGuard({ requiredRole }: AuthGuardProps) {
  const { user, loading, isSuperAdmin, isCompanyUser } = useAuth();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isAdminSubdomain = host === "admin.edilizia.io";
  const isAppSubdomain = host === "app.edilizia.io";

  if (loading) {
    return (
      <div className="dark-app min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(var(--app-bg-primary))" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(var(--app-brand))" }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // On app.edilizia.io: block access to superadmin routes entirely
  if (isAppSubdomain && requiredRole === "superadmin") {
    return <Navigate to="/app/dashboard" replace />;
  }

  // On admin.edilizia.io: block access to company routes for non-superadmins
  if (isAdminSubdomain && requiredRole === "company" && !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "superadmin" && !isSuperAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (requiredRole === "company" && !isCompanyUser && !isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return <Outlet />;
}
