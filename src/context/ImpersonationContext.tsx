import { createContext, useContext, useState, ReactNode } from "react";

interface ImpersonationContextType {
  impersonatingCompanyId: string | null;
  impersonatingCompanyName: string | null;
  startImpersonation: (companyId: string, companyName: string) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatingCompanyId, setCompanyId] = useState<string | null>(
    () => sessionStorage.getItem("impersonating_company_id")
  );
  const [impersonatingCompanyName, setCompanyName] = useState<string | null>(
    () => sessionStorage.getItem("impersonating_company_name")
  );

  const startImpersonation = (companyId: string, companyName: string) => {
    sessionStorage.setItem("impersonating_company_id", companyId);
    sessionStorage.setItem("impersonating_company_name", companyName);
    setCompanyId(companyId);
    setCompanyName(companyName);
  };

  const stopImpersonation = () => {
    sessionStorage.removeItem("impersonating_company_id");
    sessionStorage.removeItem("impersonating_company_name");
    setCompanyId(null);
    setCompanyName(null);
  };

  return (
    <ImpersonationContext.Provider value={{
      impersonatingCompanyId,
      impersonatingCompanyName,
      startImpersonation,
      stopImpersonation,
      isImpersonating: !!impersonatingCompanyId,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) throw new Error("useImpersonation must be used within ImpersonationProvider");
  return context;
}
