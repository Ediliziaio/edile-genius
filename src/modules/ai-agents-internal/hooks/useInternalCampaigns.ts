import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import type { InternalOutboundCampaign } from '../types/internalAgent.types';

export function useInternalCampaigns() {
  const companyId = useCompanyId();
  const qc = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['internal-campaigns', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('internal_outbound_campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as InternalOutboundCampaign[];
    },
    refetchInterval: 10_000, // Aggiorna ogni 10s per campagne attive
  });

  // B4 fix: startCampaign NON aggiorna status sul DB
  // L'EF internal-campaign-manager imposta status='queued' internamente
  const startCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non autenticato');

      const res = await supabase.functions.invoke('internal-campaign-manager', {
        body: { campaign_id: campaignId, action: 'start' },
      });

      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Campagna avviata');
      qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Errore avvio campagna');
      // B4 fix: Il client NON deve fare rollback — l'EF gestisce tutto
    },
  });

  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await supabase.functions.invoke('internal-campaign-manager', {
        body: { campaign_id: campaignId, action: 'pause' },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Campagna messa in pausa');
      qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resumeCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await supabase.functions.invoke('internal-campaign-manager', {
        body: { campaign_id: campaignId, action: 'resume' },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Campagna ripresa');
      qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await (supabase as any)
        .from('internal_outbound_campaigns')
        .delete()
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Campagna eliminata');
      qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createCampaign = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      agent_id?: string;
      target_type: 'manual' | 'filter';
      contact_ids?: string[];
      filter_tags?: string;
      filter_source?: string;
      scheduled_at?: string;
      calls_per_minute?: number;
    }) => {
      const { data: result, error } = await (supabase as any)
        .from('internal_outbound_campaigns')
        .insert({
          company_id: companyId,
          name: data.name,
          description: data.description || null,
          agent_id: data.agent_id || null,
          target_type: data.target_type,
          contact_ids: data.contact_ids || [],
          filter_tags: data.filter_tags || null,
          filter_source: data.filter_source || null,
          scheduled_at: data.scheduled_at || null,
          calls_per_minute: data.calls_per_minute || 2,
          status: data.scheduled_at ? 'scheduled' : 'draft',
        })
        .select('id')
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Campagna creata');
      qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    campaigns,
    isLoading,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    createCampaign,
  };
}
