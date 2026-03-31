// B3 fix: useInfiniteQuery con 50 record per pagina, filtri server-side

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import type { InternalCallLog } from '../types/internalAgent.types';

const PAGE_SIZE = 50;

interface CallLogFilters {
  dateFrom?: string;
  dateTo?: string;
  direction?: string;
  status?: string;
  agentId?: string;
  campaignId?: string;
  search?: string;
}

export function useInternalCallLogs(filters: CallLogFilters = {}) {
  const companyId = useCompanyId();

  const result = useInfiniteQuery({
    queryKey: ['internal-call-logs', companyId, filters],
    enabled: !!companyId,
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages) => {
      if ((lastPage?.data?.length || 0) < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = (supabase as any)
        .from('internal_call_logs')
        .select(`
          *,
          contact:contacts(full_name, phone, email),
          agent:agents(name),
          campaign:internal_outbound_campaigns(name)
        `, { count: 'exact' })
        .eq('company_id', companyId)
        .order('started_at', { ascending: false })
        .range(from, to);

      // Filtri server-side (B3 fix)
      if (filters.dateFrom) query = query.gte('started_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('started_at', filters.dateTo);
      if (filters.direction) query = query.eq('direction', filters.direction);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.agentId) query = query.eq('agent_id', filters.agentId);
      if (filters.campaignId) query = query.eq('campaign_id', filters.campaignId);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: (data || []) as InternalCallLog[], count: count || 0 };
    },
  });

  const allLogs = result.data?.pages.flatMap((p) => p.data) || [];
  const totalCount = result.data?.pages[0]?.count || 0;

  return {
    logs: allLogs,
    totalCount,
    isLoading: result.isLoading,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
  };
}

// Hook per callbacks programmate (M1)
export function useScheduledCallbacks(companyId: string | null) {
  return useQuery({
    queryKey: ['scheduled-callbacks', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('appointments')
        .select(`
          id, scheduled_at, notes, status,
          contact:contacts(id, full_name, phone)
        `)
        .eq('company_id', companyId)
        .eq('appointment_type', 'callback')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });
      if (error) return [];
      return data || [];
    },
    refetchInterval: 30_000,
  });
}
