import { useCompanyId } from '@/hooks/useCompanyId';
import { KnowledgeBaseManager } from '@/components/preventivo/KnowledgeBaseManager';

export default function KnowledgeBasePreventivo() {
  const companyId = useCompanyId();

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nessuna azienda selezionata
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base Preventivi</h1>
      </div>
      <KnowledgeBaseManager />
    </div>
  );
}
