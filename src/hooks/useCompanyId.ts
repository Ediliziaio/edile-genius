import { useAuth } from "@/context/AuthContext";
import { useImpersonation } from "@/context/ImpersonationContext";

export function useCompanyId(): string | null | undefined {
  const { impersonatingCompanyId } = useImpersonation();
  const { profile } = useAuth();
  return impersonatingCompanyId || profile?.company_id;
}
