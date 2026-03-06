import { Settings } from "lucide-react";

export default function SASettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Impostazioni SuperAdmin</h1>
      <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
        <Settings className="w-10 h-10 mx-auto mb-3 text-ink-300" />
        <p className="text-ink-500">Impostazioni globali in arrivo</p>
        <p className="text-xs text-ink-400 mt-1">Configurazioni avanzate per la piattaforma.</p>
      </div>
    </div>
  );
}
