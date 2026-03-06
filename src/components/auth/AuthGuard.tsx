import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  requiredRole: "superadmin" | "company";
}

export default function AuthGuard({ requiredRole }: AuthGuardProps) {
  const { user, loading, isSuperAdmin, isCompanyUser } = useAuth();

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

  if (requiredRole === "superadmin" && !isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  if (requiredRole === "company" && !isCompanyUser && !isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return <Outlet />;
}
