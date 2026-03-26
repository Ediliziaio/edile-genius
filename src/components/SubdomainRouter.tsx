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
 *   - /app/* → redirect to /superadmin/
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
      // Block superadmin area entirely
      if (pathname.startsWith("/superadmin")) {
        navigate("/app/dashboard", { replace: true });
        return;
      }
      // Root → go to login
      const allowed = ["/app", "/login", "/signup", "/forgot-password", "/reset-password", "/invito", "/s/"];
      const isAllowed = allowed.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        navigate("/login", { replace: true });
      }
    } else if (host === "admin.edilizia.io") {
      // Block company area, allow only superadmin + login
      if (pathname.startsWith("/app")) {
        navigate("/superadmin/", { replace: true });
        return;
      }
      const allowed = ["/superadmin", "/login", "/forgot-password", "/reset-password"];
      const isAllowed = allowed.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        navigate("/superadmin/", { replace: true });
      }
    }
    // edilizia.io / localhost → no redirect, full routing
  }, [pathname, navigate]);

  return null;
}
