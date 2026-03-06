import { useImpersonation } from "@/context/ImpersonationContext";
import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ImpersonationBanner() {
  const { isImpersonating, impersonatingCompanyName, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleStop = () => {
    stopImpersonation();
    navigate("/superadmin");
  };

  return (
    <div className="bg-accent-blue text-white px-4 py-2 flex items-center justify-center gap-3 text-sm z-50">
      <Eye className="w-4 h-4" />
      <span>
        Stai visualizzando come: <strong>{impersonatingCompanyName}</strong>
      </span>
      <button onClick={handleStop} className="ml-2 px-3 py-0.5 rounded-btn bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1 text-xs font-medium">
        <X className="w-3 h-3" /> Esci
      </button>
    </div>
  );
}
