import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GalleryItem {
  table: string;
  id: string;
}

export interface CreateShareOptions {
  galleryItems: GalleryItem[];
  nomeDestinatario?: string;
  emailDestinatario?: string;
  messaggio?: string;
  scadenzaGiorni?: number | null;
  titoloPagina?: string;
  coloreHeader?: string;
  mostraBefore?: boolean;
}

export interface ShareLink {
  id: string;
  token: string;
  company_id: string;
  gallery_items: GalleryItem[];
  nome_destinatario: string | null;
  email_destinatario: string | null;
  messaggio: string | null;
  scade_il: string | null;
  views_count: number;
  ultima_visita_at: string | null;
  attivo: boolean;
  created_at: string;
  titolo_pagina: string | null;
  mostra_before: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useShareLinks(companyId?: string | null) {
  const queryClient = useQueryClient();
  const [creatingUrl, setCreatingUrl] = useState<string | null>(null);

  const { data: shareLinks, isLoading } = useQuery({
    queryKey: ['share_links', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('render_share_links' as any)
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShareLink[];
    },
  });

  const createLink = useCallback(async (opts: CreateShareOptions): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: {
          galleryItems: opts.galleryItems,
          nomeDestinatario: opts.nomeDestinatario,
          emailDestinatario: opts.emailDestinatario,
          messaggio: opts.messaggio,
          scadenzaGiorni: opts.scadenzaGiorni ?? null,
          titoloPagina: opts.titoloPagina,
          coloreHeader: opts.coloreHeader,
          mostraBefore: opts.mostraBefore ?? true,
        },
      });

      if (error) throw error;

      const payload = data?.data ?? data;
      queryClient.invalidateQueries({ queryKey: ['share_links'] });

      const siteUrl = window.location.origin;
      const shareUrl = `${siteUrl}/s/${payload.token}`;
      setCreatingUrl(shareUrl);
      return shareUrl;
    } catch (err: any) {
      console.error(err);
      toast.error('Errore nella creazione del link');
      return null;
    }
  }, [queryClient]);

  const revokeLink = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase.functions.invoke('revoke-share-link', {
        body: { linkId },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['share_links'] });
      toast.success('Link disattivato');
    } catch {
      toast.error('Errore nella revoca del link');
    }
  }, [queryClient]);

  const copyLink = useCallback((token: string) => {
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiato negli appunti!');
  }, []);

  const stats = {
    totale: shareLinks?.length || 0,
    attivi: shareLinks?.filter(l => l.attivo).length || 0,
    totalViews: shareLinks?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0,
  };

  return {
    shareLinks: shareLinks || [],
    isLoading,
    createLink,
    revokeLink,
    copyLink,
    creatingUrl,
    stats,
  };
}
