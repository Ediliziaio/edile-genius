import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Team SuperAdmin</h1>
      <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
        <Users className="w-10 h-10 mx-auto mb-3 text-ink-300" />
        <p className="text-ink-500">Gestione team in arrivo</p>
        <p className="text-xs text-ink-400 mt-1">Qui potrai aggiungere e gestire gli utenti del team superadmin.</p>
      </div>
    </div>
  );
}
