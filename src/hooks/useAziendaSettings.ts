import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAziendaSettings(companyId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  // Features sbloccate per l'azienda
  const { data: featuresAzienda = [] } = useQuery({
    queryKey: ['azienda-features', companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('azienda_features_sbloccate')
        .select('*, piattaforma_features(*)')
        .eq('company_id', companyId)
        .eq('attivo', true);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Membri azienda (from profiles)
  const { data: membri = [] } = useQuery({
    queryKey: ['azienda-membri', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, company_id')
        .eq('company_id', companyId);
      
      // Get roles for each member
      if (data && data.length > 0) {
        const userIds = data.map(p => p.id);
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        return data.map(profile => ({
          ...profile,
          user_id: profile.id,
          nome: profile.full_name,
          ruolo: roles?.find(r => r.user_id === profile.id)?.role === 'company_admin' ? 'admin' : 'membro',
        }));
      }
      return [];
    },
    enabled: !!companyId,
  });

  // Invita utente
  const invitaUtente = useMutation({
    mutationFn: async ({ email, ruolo }: { email: string; ruolo: 'admin' | 'membro' }) => {
      const { data, error } = await supabase.functions.invoke('invita-membro', {
        body: { company_id: companyId, email, ruolo },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['azienda-membri', companyId] });
      toast({ title: 'Invito inviato!' });
    },
    onError: (err: any) => toast({ title: 'Errore invito', description: err.message, variant: 'destructive' }),
  });

  // Aggiorna permesso utente
  const aggiornaPermesso = useMutation({
    mutationFn: async ({ userId, featureId, abilitato, limiteMensile, limiteGiornaliero }: {
      userId: string; featureId: string; abilitato: boolean;
      limiteMensile?: number | null; limiteGiornaliero?: number | null;
    }) => {
      const { error } = await (supabase as any)
        .from('user_feature_permissions')
        .upsert({
          company_id: companyId,
          user_id: userId,
          feature_id: featureId,
          abilitato,
          limite_mensile: limiteMensile,
          limite_giornaliero: limiteGiornaliero,
        }, { onConflict: 'company_id,user_id,feature_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['user-permissions', companyId, vars.userId] });
      toast({ title: 'Permessi aggiornati' });
    },
  });

  // Rimuovi membro
  const rimuoviMembro = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['azienda-membri', companyId] });
      toast({ title: 'Membro rimosso' });
    },
  });

  // Cambia ruolo
  const cambiaRuolo = useMutation({
    mutationFn: async ({ userId, ruolo }: { userId: string; ruolo: 'admin' | 'membro' }) => {
      const newRole = ruolo === 'admin' ? 'company_admin' : 'company_user';
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['azienda-membri', companyId] }),
  });

  return { featuresAzienda, membri, invitaUtente, aggiornaPermesso, rimuoviMembro, cambiaRuolo };
}
