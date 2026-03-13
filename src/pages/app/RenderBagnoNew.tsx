import { Bath } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RenderBagnoNew() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Nuovo Render Bagno</h1>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Bath className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Configuratore in arrivo</p>
          <p className="text-sm">Il configuratore bagno sarà disponibile nel prossimo aggiornamento (Doc 2/5)</p>
        </CardContent>
      </Card>
    </div>
  );
}
