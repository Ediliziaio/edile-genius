import { Label } from "@/components/ui/label";
import type { ProfiloTelaioSize, ProfiloForma, ManigliaType, ColoreFerratura } from "@/modules/render/lib/promptBuilder";

interface Props {
  profiloDimensione: ProfiloTelaioSize;
  profiloForma: ProfiloForma;
  maniglia: ManigliaType;
  coloreFerratura: ColoreFerratura;
  onChange: (field: string, value: string) => void;
}

const profili: { value: ProfiloTelaioSize; label: string; desc: string; icon: string }[] = [
  { value: "70mm", label: "Residenziale", desc: "70mm · 3 camere", icon: "🏠" },
  { value: "82mm", label: "Premium", desc: "82mm · 5 camere", icon: "⭐" },
  { value: "92mm", label: "Passivhaus", desc: "92mm · 7 camere", icon: "🛡️" },
];

const forme: { value: ProfiloForma; label: string }[] = [
  { value: "squadrato", label: "Squadrato" },
  { value: "arrotondato", label: "Arrotondato" },
  { value: "europeo", label: "Europeo" },
];

const maniglie: { value: ManigliaType; label: string; icon: string }[] = [
  { value: "leva_alluminio", label: "Leva Alluminio", icon: "🔧" },
  { value: "leva_acciaio", label: "Leva Acciaio", icon: "🔩" },
  { value: "pomolo", label: "Pomolo", icon: "⚫" },
  { value: "alzante", label: "Alzante", icon: "↕️" },
];

const coloriFerratura: { value: ColoreFerratura; label: string; color: string }[] = [
  { value: "argento", label: "Argento", color: "#C0C0C0" },
  { value: "nero_opaco", label: "Nero", color: "#1a1a1a" },
  { value: "inox", label: "Inox", color: "#8B8B8B" },
  { value: "bronzo", label: "Bronzo", color: "#8B6914" },
  { value: "oro", label: "Oro", color: "#D4A017" },
];

export default function ProfileHardwareConfig({ profiloDimensione, profiloForma, maniglia, coloreFerratura, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Profilo Telaio */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Profilo Telaio</Label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {profili.map((p) => (
            <button
              key={p.value}
              onClick={() => onChange("profiloDimensione", p.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center text-sm transition-all ${
                profiloDimensione === p.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <span className="font-medium text-foreground text-xs">{p.label}</span>
              <span className="text-[10px] text-muted-foreground">{p.desc}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {forme.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange("profiloForma", f.value)}
              className={`flex-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                profiloForma === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ferramenta */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Maniglia</Label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {maniglie.map((m) => (
            <button
              key={m.value}
              onClick={() => onChange("maniglia", m.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                maniglia === m.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-lg">{m.icon}</span>
              <span className="font-medium text-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Colore Ferramenta */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Colore Ferramenta</Label>
        <div className="flex gap-2">
          {coloriFerratura.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange("coloreFerratura", c.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                coloreFerratura === c.value
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full border border-border"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-[10px] text-muted-foreground">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
