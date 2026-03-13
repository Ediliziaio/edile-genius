import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Mail, Phone, ImageOff } from 'lucide-react';
import { unwrapEdge } from '@/lib/edgePayload';

interface ShareData {
  shareLink: {
    id: string;
    nome_destinatario: string | null;
    messaggio: string | null;
    titolo_pagina: string | null;
    mostra_before: boolean;
    colore_header: string | null;
    scade_il: string | null;
  };
  azienda: {
    nome: string;
    logo_url: string | null;
    colore_primario: string;
    sito_web: string | null;
    email_contatto: string | null;
    telefono: string | null;
  } | null;
  renders: Array<{
    id: string;
    modulo: string;
    result_url: string | null;
    original_url: string | null;
    titolo: string | null;
  }>;
}

type ViewState = 'loading' | 'loaded' | 'not_found' | 'expired' | 'error';

export default function PublicShareViewer() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ViewState>('loading');
  const [data, setData] = useState<ShareData | null>(null);
  const [showBefore, setShowBefore] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) { setState('not_found'); return; }

    (async () => {
      try {
        const { data: raw, error } = await supabase.functions.invoke('get-share-data', {
          body: null,
          method: 'GET',
          headers: {},
        });

        // Since functions.invoke doesn't support query params well, use fetch directly
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-share-data?token=${encodeURIComponent(token)}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (res.status === 404) { setState('not_found'); return; }
        if (res.status === 410) { setState('expired'); return; }
        if (!res.ok) { setState('error'); return; }

        const json = await res.json();
        const payload = json?.data ?? json;
        setData(payload as ShareData);
        setState('loaded');
      } catch {
        setState('error');
      }
    })();
  }, [token]);

  const color = data?.azienda?.colore_primario || '#6D28D9';

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <ImageOff className="w-12 h-12 text-gray-300 mx-auto" />
          <h1 className="text-xl font-semibold text-gray-700">Link non trovato</h1>
          <p className="text-gray-500">Questo link potrebbe essere stato disattivato.</p>
        </div>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <ImageOff className="w-12 h-12 text-gray-300 mx-auto" />
          <h1 className="text-xl font-semibold text-gray-700">Link scaduto</h1>
          <p className="text-gray-500">Questo link di condivisione è scaduto.</p>
        </div>
      </div>
    );
  }

  if (state === 'error' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-gray-700">Errore</h1>
          <p className="text-gray-500">Impossibile caricare i dati.</p>
        </div>
      </div>
    );
  }

  const { shareLink, azienda, renders } = data;

  const toggleBefore = (id: string) => {
    setShowBefore(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with company branding */}
      <header
        className="py-6 px-6"
        style={{ backgroundColor: color }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {azienda?.logo_url && (
              <img
                src={azienda.logo_url}
                alt={azienda.nome}
                className="h-10 w-auto rounded bg-white/20 p-1"
              />
            )}
            <span className="text-white font-semibold text-lg">
              {azienda?.nome || 'Render Gallery'}
            </span>
          </div>
          {azienda?.sito_web && (
            <a
              href={azienda.sito_web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white text-sm flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Sito web
            </a>
          )}
        </div>
      </header>

      {/* Title & message */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {shareLink.nome_destinatario && (
          <p className="text-gray-500 text-sm mb-1">
            Preparato per <span className="font-medium text-gray-700">{shareLink.nome_destinatario}</span>
          </p>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {shareLink.titolo_pagina || 'Render Gallery'}
        </h1>
        {shareLink.messaggio && (
          <p className="text-gray-600 mb-6 max-w-2xl">{shareLink.messaggio}</p>
        )}

        {/* Renders grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {renders.map((render) => {
            const isBefore = showBefore[render.id];
            const imageUrl = isBefore ? render.original_url : render.result_url;

            return (
              <div
                key={render.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={render.titolo || 'Render'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Before/After badge */}
                  {isBefore && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded">
                      Prima
                    </span>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div>
                    {render.titolo && (
                      <p className="font-medium text-gray-800 text-sm">{render.titolo}</p>
                    )}
                    <p className="text-xs text-gray-400 capitalize">{render.modulo}</p>
                  </div>
                  {shareLink.mostra_before && render.original_url && (
                    <button
                      onClick={() => toggleBefore(render.id)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: isBefore ? `${color}20` : '#f3f4f6',
                        color: isBefore ? color : '#6b7280',
                      }}
                    >
                      {isBefore ? 'Mostra dopo' : 'Mostra prima'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {renders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ImageOff className="w-10 h-10 mx-auto mb-2" />
            <p>Nessun render disponibile</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <footer className="border-t border-gray-100 py-8 px-6 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            Gallery condivisa da <span className="font-medium">{azienda?.nome}</span>
          </p>
          <div className="flex items-center gap-4">
            {azienda?.email_contatto && (
              <a
                href={`mailto:${azienda.email_contatto}`}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color }}
              >
                <Mail className="w-4 h-4" />
                Contattaci
              </a>
            )}
            {azienda?.telefono && (
              <a
                href={`tel:${azienda.telefono}`}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color }}
              >
                <Phone className="w-4 h-4" />
                {azienda.telefono}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
