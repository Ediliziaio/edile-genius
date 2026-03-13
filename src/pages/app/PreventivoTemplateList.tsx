import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Settings, Star, Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

export default function PreventivoTemplateList() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['preventivo_templates', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('preventivo_templates')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const duplicateTemplate = async (template: any) => {
    if (!companyId) return;
    const { id: _id, created_at: _ca, ...rest } = template;
    const { error } = await supabase
      .from('preventivo_templates')
      .insert({ ...rest, company_id: companyId, nome: `${template.nome} (copia)`, is_default: false });
    if (error) { toast.error('Errore duplicazione'); return; }
    toast.success('Template duplicato!');
    queryClient.invalidateQueries({ queryKey: ['preventivo_templates'] });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Template preventivo</h1>
        <Button asChild size="sm">
          <Link to="/app/preventivi/templates/nuovo">
            <Plus className="w-4 h-4 mr-1" /> Nuovo template
          </Link>
        </Button>
      </div>

      {!isLoading && templates?.length === 0 && (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Nessun template ancora</p>
          <Button asChild size="sm">
            <Link to="/app/preventivi/templates/nuovo">Crea il primo template</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-3">
        {templates?.map((t: any) => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{t.nome}</h3>
                {t.is_default && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="w-3 h-3" /> Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(t.sezioni as any[])?.filter((s: any) => s.attiva).length || 0} sezioni attive
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => duplicateTemplate(t)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg" title="Duplica">
                <Copy className="w-4 h-4" />
              </button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/app/preventivi/templates/${t.id}`}>
                  <Settings className="w-4 h-4 mr-1" /> Modifica
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
