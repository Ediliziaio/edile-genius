import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';

interface PermessoResult {
  consentito: boolean;
  motivo?: string;
  usatoMese?: number;
  limiteMese?: number | null;
}

export function useCheckPermesso(featureId: string): PermessoResult {
  const { user } = useAuth();
  const companyId = useCompanyId();

  const { data } = useQuery({
    queryKey: ['check-permesso', companyId, user?.id, featureId],
    queryFn: async () => {
      if (!companyId || !user?.id) return { consentito: false, motivo: 'no_auth' };

      // Check company feature
      const { data: companyFeature } = await (supabase as any)
        .from('azienda_features_sbloccate')
        .select('*, piattaforma_features(*)')
        .eq('company_id', companyId)
        .eq('feature_id', featureId)
        .eq('attivo', true)
        .maybeSingle();

      if (!companyFeature) return { consentito: false, motivo: 'feature_non_sbloccata' };

      // Check user permission
      const { data: userPerm } = await (supabase as any)
        .from('user_feature_permissions')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('feature_id', featureId)
        .maybeSingle();

      if (userPerm && !userPerm.abilitato) return { consentito: false, motivo: 'disabilitato_admin' };

      // Check monthly usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await (supabase as any)
        .from('user_feature_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('feature_id', featureId)
        .gte('usato_il', startOfMonth.toISOString());

      const usato = count || 0;
      const limite = userPerm?.limite_mensile ?? companyFeature.limite_mensile;

      if (limite && usato >= limite) return { consentito: false, motivo: 'limite_mensile', usatoMese: usato, limiteMese: limite };

      return { consentito: true, usatoMese: usato, limiteMese: limite };
    },
    enabled: !!companyId && !!user?.id && !!featureId,
    staleTime: 30_000,
  });

  return data || { consentito: true };
}

export async function registraUtilizzo(companyId: string, userId: string, featureId: string, dettagli?: Record<string, unknown>) {
  await (supabase as any).from('user_feature_usage').insert({
    company_id: companyId,
    user_id: userId,
    feature_id: featureId,
    dettagli: dettagli || null,
  });
}
