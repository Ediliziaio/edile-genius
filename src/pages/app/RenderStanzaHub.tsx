import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

export default function RenderStanzaHub() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <Wand2 className="h-16 w-16 text-violet-500" />
      <h1 className="text-3xl font-bold text-foreground">Render Stanza Completo</h1>
      <p className="text-muted-foreground max-w-md">
        Trasforma ogni ambiente — pareti, pavimento, arredo e molto altro
      </p>
      <Button onClick={() => navigate("/app/render-stanza/new")} className="bg-violet-600 hover:bg-violet-700">
        <Wand2 className="mr-2 h-4 w-4" />
        Nuovo Render
      </Button>
    </div>
  );
}
