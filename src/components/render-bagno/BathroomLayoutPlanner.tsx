import type { ConfigLayout } from "@/modules/render-bagno/lib/bathroomPromptBuilder";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const POSIZIONI_DOCCIA: { val: ConfigLayout["posizione_doccia"]; label: string; icon: string }[] = [
  { val: "fondo_sinistra", label: "Fondo Sinistra", icon: "↙" },
  { val: "fondo_destra", label: "Fondo Destra", icon: "↘" },
  { val: "fondo_centro", label: "Fondo Centro", icon: "↓" },
  { val: "laterale_sinistra", label: "Laterale Sinistra", icon: "←" },
  { val: "laterale_destra", label: "Laterale Destra", icon: "→" },
];

const POSIZIONI_VASCA: { val: ConfigLayout["posizione_vasca"]; label: string }[] = [
  { val: "parete_lunga", label: "Parete Lunga" },
  { val: "parete_corta", label: "Parete Corta" },
  { val: "angolo", label: "In Angolo" },
  { val: "centro", label: "Centro Stanza" },
  { val: "assente", label: "Nessuna Vasca" },
];

const POSIZIONI_MOBILE: { val: ConfigLayout["posizione_mobile"]; label: string }[] = [
  { val: "parete_lunga", label: "Parete Lunga" },
  { val: "parete_corta", label: "Parete Corta" },
  { val: "angolo", label: "In Angolo" },
];

const POSIZIONI_WC: { val: ConfigLayout["posizione_wc"]; label: string }[] = [
  { val: "accanto_mobile", label: "Accanto al Mobile" },
  { val: "angolo", label: "In un Angolo" },
  { val: "parete_corta", label: "Parete Corta" },
];

interface LayoutPlannerProps {
  value: ConfigLayout;
  onChange: (v: ConfigLayout) => void;
}

export function BathroomLayoutPlanner({ value, onChange }: LayoutPlannerProps) {
  return (
    <div className="space-y-6">
      {/* Avviso demolizione */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="font-semibold text-foreground">🏗️ Rifacimento Totale Attivo</p>
        <p className="text-sm text-muted-foreground mt-1">
          L'AI ridisegnerà il bagno con tutti gli elementi nuovi nel layout che specifichi.
          Le pareti, le finestre e le porte rimangono nella posizione originale.
        </p>
      </div>

      {/* Dimensioni bagno */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Dimensioni bagno (stima)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Larghezza (cm)</Label>
            <Input
              type="number"
              value={value.larghezza_cm}
              onChange={e => onChange({ ...value, larghezza_cm: parseInt(e.target.value) || 200 })}
              min={100} max={600} step={10}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Lunghezza (cm)</Label>
            <Input
              type="number"
              value={value.lunghezza_cm}
              onChange={e => onChange({ ...value, lunghezza_cm: parseInt(e.target.value) || 250 })}
              min={120} max={800} step={10}
            />
          </div>
        </div>
      </div>

      {/* Pianta schematica */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Anteprima layout schematico</Label>
        <BathroomSchematicPreview layout={value} />
      </div>

      {/* Posizionamento doccia */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">🚿 Posizione Doccia</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POSIZIONI_DOCCIA.map(p => (
            <button
              key={p.val}
              type="button"
              onClick={() => onChange({ ...value, posizione_doccia: p.val })}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-left transition-all ${
                value.posizione_doccia === p.val ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posizionamento vasca */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">🛁 Posizione Vasca</Label>
        <div className="flex flex-wrap gap-2">
          {POSIZIONI_VASCA.map(p => (
            <button
              key={p.val}
              type="button"
              onClick={() => onChange({ ...value, posizione_vasca: p.val })}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                value.posizione_vasca === p.val ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posizionamento mobile */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">🪑 Posizione Mobile Bagno</Label>
        <div className="flex flex-wrap gap-2">
          {POSIZIONI_MOBILE.map(p => (
            <button
              key={p.val}
              type="button"
              onClick={() => onChange({ ...value, posizione_mobile: p.val })}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                value.posizione_mobile === p.val ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posizionamento WC */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">🚽 Posizione WC/Bidet</Label>
        <div className="flex flex-wrap gap-2">
          {POSIZIONI_WC.map(p => (
            <button
              key={p.val}
              type="button"
              onClick={() => onChange({ ...value, posizione_wc: p.val })}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                value.posizione_wc === p.val ? "border-primary bg-primary/10 text-primary" : "border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note libere layout */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Note layout (opzionale)</Label>
        <Textarea
          value={value.note_layout || ""}
          onChange={e => onChange({ ...value, note_layout: e.target.value })}
          placeholder="Es: 'la doccia deve essere a sinistra della porta', 'voglio nicchia per il wc'..."
          rows={3}
        />
      </div>
    </div>
  );
}

// ── Anteprima schematica 2D del layout ──────────────────────────
function BathroomSchematicPreview({ layout }: { layout: ConfigLayout }) {
  const W = layout.larghezza_cm;
  const L = layout.lunghezza_cm;

  const getElementAtPosition = () => {
    const schema: Record<string, string> = {};
    const dPos = layout.posizione_doccia;
    if (dPos === "fondo_sinistra") schema.fondo_sx = "🚿";
    if (dPos === "fondo_destra") schema.fondo_dx = "🚿";
    if (dPos === "fondo_centro") schema.fondo_c = "🚿";
    if (dPos === "laterale_sinistra") schema.lat_sx = "🚿";
    if (dPos === "laterale_destra") schema.lat_dx = "🚿";
    schema.fronte_sx = "🪑";
    schema.fronte_dx = "🚽";
    if (layout.posizione_vasca === "parete_lunga") schema.lungo = "🛁";
    if (layout.posizione_vasca === "centro") schema.centro = "🛁";
    if (layout.posizione_vasca === "angolo") schema.fondo_sx = schema.fondo_sx ? schema.fondo_sx + "🛁" : "🛁";
    return schema;
  };

  const s = getElementAtPosition();

  return (
    <div
      className="relative w-full max-w-[280px] mx-auto border-4 border-foreground rounded-lg bg-muted/20"
      style={{ aspectRatio: `${W}/${L}` }}
    >
      <div className="absolute top-2 left-2 text-2xl">{s.fondo_sx || ""}</div>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl">{s.fondo_c || ""}</div>
      <div className="absolute top-2 right-2 text-2xl">{s.fondo_dx || ""}</div>
      <div className="absolute top-1/2 -translate-y-1/2 left-2 text-2xl">{s.lat_sx || ""}</div>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 text-2xl">{s.lat_dx || ""}</div>
      <div className="absolute bottom-2 left-2 text-2xl">{s.fronte_sx || ""}</div>
      <div className="absolute bottom-2 right-2 text-2xl">{s.fronte_dx || ""}</div>
      <div className="absolute inset-0 flex items-center justify-center text-2xl">{s.centro || ""}</div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-2xl">{s.lungo || ""}</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs bg-background px-1 border-x-2 border-t-2 border-foreground rounded-t">
        🚪
      </div>
      <div className="absolute -bottom-6 w-full text-center text-xs text-muted-foreground">
        {W}×{L} cm
      </div>
    </div>
  );
}
