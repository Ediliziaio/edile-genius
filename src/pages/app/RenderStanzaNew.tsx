import { Wand2 } from "lucide-react";

export default function RenderStanzaNew() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <Wand2 className="h-12 w-12 text-violet-500" />
      <h1 className="text-2xl font-bold text-foreground">Wizard Render Stanza</h1>
      <p className="text-muted-foreground">Il wizard completo sarà disponibile nel Doc 3/5.</p>
    </div>
  );
}
