import { Key } from "lucide-react";

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">API Keys</h1>
      <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
        <Key className="w-10 h-10 mx-auto mb-3 text-ink-300" />
        <p className="text-ink-500">Gestione API Keys in arrivo</p>
        <p className="text-xs text-ink-400 mt-1">Qui potrai gestire le chiavi API globali della piattaforma.</p>
      </div>
    </div>
  );
}
