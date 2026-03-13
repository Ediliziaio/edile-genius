import { useState } from 'react';
import { Plus, Trash2, Wand2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { VarianteConfig } from '@/hooks/useVariantiGenerator';

interface VariantiConfiguratorProps {
  onGenerate: (varianti: VarianteConfig[]) => void;
  onCancel: () => void;
  generating?: boolean;
  currentVariante?: number;
}

const PRESET_VARIANTI: VarianteConfig[] = [
  {
    nome: 'Variante A',
    colore_hex: '#C8D8B0',
    modifica_principale: 'pareti verde salvia',
    prompt_extra: 'Applica alle pareti un colore verde salvia (#C8D8B0), tono naturale e rilassante. Mantieni arredi, pavimenti e illuminazione identici.',
  },
  {
    nome: 'Variante B',
    colore_hex: '#B8AFA8',
    modifica_principale: 'pareti grigio caldo',
    prompt_extra: 'Applica alle pareti un colore grigio caldo (#B8AFA8), tono neutro e sofisticato. Mantieni arredi, pavimenti e illuminazione identici.',
  },
];

const QUICK_COLORS = [
  { label: 'Bianco puro', hex: '#FAFAFA' },
  { label: 'Grigio perla', hex: '#E8E4E0' },
  { label: 'Grigio caldo', hex: '#B8AFA8' },
  { label: 'Verde salvia', hex: '#C8D8B0' },
  { label: 'Verde bosco', hex: '#4A7C59' },
  { label: 'Terracotta', hex: '#C4714A' },
  { label: 'Blu notte', hex: '#1B2D5A' },
  { label: 'Giallo caldo', hex: '#F0C040' },
  { label: 'Rosa cipria', hex: '#E8C4B8' },
  { label: 'Antracite', hex: '#3C3C3C' },
];

export function VariantiConfigurator({
  onGenerate,
  onCancel,
  generating = false,
  currentVariante = 0,
}: VariantiConfiguratorProps) {
  const [varianti, setVarianti] = useState<VarianteConfig[]>(PRESET_VARIANTI);

  const addVariante = () => {
    if (varianti.length >= 3) return;
    setVarianti(prev => [...prev, {
      nome: `Variante ${String.fromCharCode(65 + prev.length)}`,
      colore_hex: '#9E9E9E',
      modifica_principale: '',
      prompt_extra: '',
    }]);
  };

  const removeVariante = (index: number) => {
    if (varianti.length <= 2) return;
    setVarianti(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariante = (index: number, field: keyof VarianteConfig, value: string) => {
    setVarianti(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const applyQuickColor = (index: number, hex: string, label: string) => {
    setVarianti(prev => prev.map((v, i) => i === index ? {
      ...v,
      colore_hex: hex,
      modifica_principale: `pareti ${label.toLowerCase()}`,
      prompt_extra: `Applica alle pareti il colore ${label} (${hex}). Mantieni arredi, pavimenti e illuminazione identici all'originale.`,
    } : v));
  };

  const canGenerate = varianti.every(v => v.nome && v.prompt_extra);

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden max-w-2xl w-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Genera varianti di confronto</h3>
            <p className="text-xs text-muted-foreground">
              Crea {varianti.length} versioni dello stesso ambiente con configurazioni diverse
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        {varianti.map((variante, index) => (
          <div key={index} className="border border-border rounded-xl p-4 space-y-3 bg-background">
            {/* Intestazione variante */}
            <div className="flex items-center gap-2">
              <label className="relative w-8 h-8 rounded-lg border-2 border-border overflow-hidden flex-shrink-0 cursor-pointer">
                <div className="w-full h-full" style={{ backgroundColor: variante.colore_hex }} />
                <input
                  type="color"
                  value={variante.colore_hex}
                  onChange={e => updateVariante(index, 'colore_hex', e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
              <Input
                value={variante.nome}
                onChange={e => updateVariante(index, 'nome', e.target.value)}
                className="flex-1 font-semibold text-sm h-9"
                placeholder="Nome variante"
              />
              {varianti.length > 2 && (
                <button
                  onClick={() => removeVariante(index)}
                  className="p-1.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick color picks */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Scelta rapida colore pareti:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => applyQuickColor(index, c.hex, c.label)}
                    title={c.label}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      variante.colore_hex === c.hex
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    style={{ backgroundColor: c.hex, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                  />
                ))}
              </div>
            </div>

            {/* Modifica principale */}
            <div>
              <Label className="text-xs text-muted-foreground">Modifica principale</Label>
              <Input
                value={variante.modifica_principale}
                onChange={e => updateVariante(index, 'modifica_principale', e.target.value)}
                className="mt-1 text-sm h-8"
                placeholder="es. pareti verde salvia"
              />
            </div>

            {/* Prompt extra */}
            <div>
              <Label className="text-xs text-muted-foreground">Istruzioni per l'AI</Label>
              <Textarea
                value={variante.prompt_extra}
                onChange={e => updateVariante(index, 'prompt_extra', e.target.value)}
                className="mt-1 text-sm resize-none"
                rows={2}
                placeholder="Descrivi le modifiche da applicare in questa variante..."
              />
            </div>
          </div>
        ))}

        {/* Aggiungi variante */}
        {varianti.length < 3 && (
          <button
            onClick={addVariante}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Aggiungi terza variante
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
        {generating ? (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Wand2 className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">
                Generazione variante {currentVariante + 1} di {varianti.length}…
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((currentVariante) / varianti.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Annulla
            </Button>
            <Button
              size="sm"
              disabled={!canGenerate}
              onClick={() => onGenerate(varianti)}
              className="gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Genera {varianti.length} varianti
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
