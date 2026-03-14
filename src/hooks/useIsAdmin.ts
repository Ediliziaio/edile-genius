import { useAuth } from "@/context/AuthContext";

export function useIsAdmin(): boolean {
  const { roles } = useAuth();
  return roles.some((r) => r === "company_admin" || r === "superadmin" || r === "superadmin_user");
}
