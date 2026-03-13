import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConfigElementiArchitettonici, AnalysiFacciata } from "../lib/facciataPromptBuilder";

interface Props {
  value: ConfigElementiArchitettonici;
  onChange: (v: ConfigElementiArchitettonici) => void;
  analisi: AnalysiFacciata;
}

export function ElementiArchitettoniciPanel({ value, onChange, analisi }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold block">Elementi architettonici</Label>

      {/* Cornici finestre */}
      <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Cornici finestre</p>
          <p className="text-xs text-muted-foreground">
            {analisi.presenza_cornici_finestre
              ? `Presenti (${analisi.colore_cornici || "colore attuale"})`
              : "Non presenti nella foto"}
          </p>
          {value.cornici_finestre.cambia && (
            <Input
              placeholder="Nuovo colore (es. bianco, grigio...)"
              className="mt-2 text-sm h-8"
              value={value.cornici_finestre.colore_name || ""}
              onChange={(e) => onChange({
                ...value,
                cornici_finestre: { ...value.cornici_finestre, colore_name: e.target.value },
              })}
            />
          )}
        </div>
        <Switch
          checked={value.cornici_finestre.cambia}
          onCheckedChange={(checked) => onChange({
            ...value,
            cornici_finestre: { ...value.cornici_finestre, cambia: checked },
          })}
        />
      </div>

      {/* Marcapiani */}
      <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Marcapiani</p>
          <p className="text-xs text-muted-foreground">
            {analisi.presenza_marcapiani ? "Presenti" : "Non presenti"}
          </p>
          {value.marcapiani.cambia && (
            <Input
              placeholder="Nuovo colore (es. bianco, beige...)"
              className="mt-2 text-sm h-8"
              value={value.marcapiani.colore_name || ""}
              onChange={(e) => onChange({
                ...value,
                marcapiani: { ...value.marcapiani, colore_name: e.target.value },
              })}
            />
          )}
        </div>
        <Switch
          checked={value.marcapiani.cambia}
          onCheckedChange={(checked) => onChange({
            ...value,
            marcapiani: { ...value.marcapiani, cambia: checked },
          })}
        />
      </div>

      {/* Davanzali */}
      <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Davanzali</p>
          <p className="text-xs text-muted-foreground">Materiale dei davanzali finestre</p>
          {value.davanzali.cambia && (
            <Select
              value={value.davanzali.materiale || "pietra"}
              onValueChange={(v) => onChange({
                ...value,
                davanzali: { ...value.davanzali, materiale: v as any },
              })}
            >
              <SelectTrigger className="mt-2 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pietra">Pietra</SelectItem>
                <SelectItem value="marmo">Marmo</SelectItem>
                <SelectItem value="cemento">Cemento</SelectItem>
                <SelectItem value="laterizio">Laterizio</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <Switch
          checked={value.davanzali.cambia}
          onCheckedChange={(checked) => onChange({
            ...value,
            davanzali: { ...value.davanzali, cambia: checked },
          })}
        />
      </div>
    </div>
  );
}
