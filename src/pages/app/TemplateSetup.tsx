import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TemplateSetupPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  return (
    <div className="px-8 py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(`/app/templates/${slug}`)}>
        <ArrowLeft size={16} className="mr-1" /> Indietro
      </Button>
      <h1 className="text-2xl font-extrabold text-foreground">Configurazione Template</h1>
      <p className="text-muted-foreground mt-1">Wizard di configurazione in arrivo nella prossima fase.</p>
    </div>
  );
}
