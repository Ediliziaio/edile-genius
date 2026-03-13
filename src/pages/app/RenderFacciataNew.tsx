import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function RenderFacciataNew() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/render-facciata">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuovo Render Facciata</h1>
          <p className="text-muted-foreground">Carica una foto e configura l'intervento</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <Home className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Wizard in arrivo</p>
          <p className="text-sm max-w-md mx-auto">
            Il wizard completo per il render facciata sarà implementato nel Doc 2.
            Includerà: upload foto, analisi AI, configurazione colore/cappotto/rivestimenti e generazione render.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
