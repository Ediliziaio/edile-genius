import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Handles subdomain-based routing — full separation between areas:
 *
 * app.edilizia.io
 *   - Allowed: /app/*, /login, /signup, auth routes
 *   - /superadmin/* → redirect to /app/dashboard
 *   - / → redirect to /login
 *
 * admin.edilizia.io
 *   - Allowed: /superadmin/*, /login
 *   - /app/* → redirect to /superadmin/ (UNLESS superadmin is impersonating a company)
 *   - / or anything else → redirect to /superadmin/
 *
 * edilizia.io / localhost → no restrictions, full routing
 */
export default function SubdomainRouter() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const host = window.location.hostname;

    if (host === "app.edilizia.io") {
      if (pathname.startsWith("/superadmin")) {
        navigate("/app", { replace: true });
        return;
      }
      const allowed = ["/app", "/login", "/signup", "/forgot-password", "/reset-password", "/invito", "/s/"];
      if (!allowed.some((p) => pathname.startsWith(p))) {
        navigate("/login", { replace: true });
      }
    } else if (host === "admin.edilizia.io") {
      // Allow /app/* only when superadmin is actively impersonating a company
      const isImpersonating = !!sessionStorage.getItem("impersonating_company_id");
      if (pathname.startsWith("/app") && isImpersonating) return;

      if (pathname.startsWith("/app")) {
        navigate("/superadmin/", { replace: true });
        return;
      }
      const allowed = ["/superadmin", "/login", "/forgot-password", "/reset-password"];
      if (!allowed.some((p) => pathname.startsWith(p))) {
        navigate("/superadmin/", { replace: true });
      }
    }
    // edilizia.io / localhost → no redirect, full routing
  }, [pathname, navigate]);

  return null;
}
