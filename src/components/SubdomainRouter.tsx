import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Handles subdomain-based routing:
 * - app.edilizia.io   → only /app/*, /login, /signup, auth routes
 * - admin.edilizia.io → only /superadmin/* routes
 * - edilizia.io       → full marketing site + everything else
 */
export default function SubdomainRouter() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const host = window.location.hostname;

    if (host === "app.edilizia.io") {
      const allowed = ["/app", "/login", "/signup", "/forgot-password", "/reset-password", "/invito", "/s/"];
      const isAllowed = allowed.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        navigate("/login", { replace: true });
      }
    } else if (host === "admin.edilizia.io") {
      if (!pathname.startsWith("/superadmin")) {
        navigate("/superadmin/", { replace: true });
      }
    }
    // edilizia.io / localhost → no redirect, full routing
  }, [pathname, navigate]);

  return null;
}
