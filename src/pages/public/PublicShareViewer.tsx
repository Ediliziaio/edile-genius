import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ExternalLink, Mail, Phone, ImageOff, Download } from 'lucide-react';

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

  const color = data?.azienda?.colore_primario || '#38b77c';

  if (state === 'loading') return <LoadingScreen />;
  if (state === 'not_found') return <ErrorScreen type="not_found" />;
  if (state === 'expired') return <ErrorScreen type="expired" />;
  if (state === 'error' || !data) return <ErrorScreen type="error" />;

  const { shareLink, azienda, renders } = data;
  const toggleBefore = (id: string) => setShowBefore(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded Header */}
      <header className="relative overflow-hidden" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {azienda?.logo_url ? (
              <img src={azienda.logo_url} alt={azienda.nome} className="h-12 w-auto rounded-lg bg-white/20 p-1.5" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                {azienda?.nome?.[0] || '?'}
              </div>
            )}
            <div>
              <p className="text-white/70 text-sm font-medium">{azienda?.nome || 'Studio'}</p>
              <h1 className="text-white text-xl font-bold">
                {shareLink.titolo_pagina || 'Render Gallery'}
              </h1>
            </div>
          </div>
          {azienda?.sito_web && (
            <a href={azienda.sito_web} target="_blank" rel="noopener noreferrer"
               className="text-white/80 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              <ExternalLink className="w-4 h-4" /> Sito web
            </a>
          )}
        </div>
      </header>

      {/* Personal message */}
      {(shareLink.nome_destinatario || shareLink.messaggio) && (
        <div className="max-w-5xl mx-auto px-6 -mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            {shareLink.nome_destinatario && (
              <p className="text-gray-500 text-sm mb-1">
                Preparato per <span className="font-semibold text-gray-800">{shareLink.nome_destinatario}</span>
              </p>
            )}
            {shareLink.messaggio && (
              <p className="text-gray-600">{shareLink.messaggio}</p>
            )}
          </div>
        </div>
      )}

      {/* Renders grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Proposte di render</h2>
          <span className="text-sm text-gray-400">{renders.length} immagini</span>
        </div>

        {renders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImageOff className="w-10 h-10 mx-auto mb-2" />
            <p>Nessun render disponibile</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {renders.map((render, idx) => {
              const isBefore = showBefore[render.id];
              const imageUrl = isBefore ? render.original_url : render.result_url;
              const hasOriginal = shareLink.mostra_before && !!render.original_url;

              const handleDownload = async () => {
                if (!render.result_url) return;
                try {
                  const res = await fetch(render.result_url);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `render-${idx + 1}.jpg`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch { /* ignore */ }
              };

              return (
                <div key={render.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={render.titolo || 'Render'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {isBefore && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded">
                        Prima
                      </span>
                    )}
                    {/* Before/After toggle */}
                    {hasOriginal && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex bg-black/60 backdrop-blur-sm rounded-full p-0.5">
                        <button
                          onClick={() => setShowBefore(p => ({ ...p, [render.id]: false }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            !isBefore ? 'bg-white text-gray-800 shadow' : 'text-white/80 hover:text-white'
                          }`}
                        >Dopo</button>
                        <button
                          onClick={() => setShowBefore(p => ({ ...p, [render.id]: true }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isBefore ? 'bg-white text-gray-800 shadow' : 'text-white/80 hover:text-white'
                          }`}
                        >Prima</button>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      {render.titolo && <p className="font-medium text-gray-800 text-sm">{render.titolo}</p>}
                      <p className="text-xs text-gray-400 capitalize">{render.modulo}</p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Scarica
                    </button>
                  </div>
                </div>
              );
            })}
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
              <a href={`mailto:${azienda.email_contatto}?subject=Richiesta preventivo`}
                 className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color }}>
                <Mail className="w-4 h-4" /> Richiedi preventivo
              </a>
            )}
            {azienda?.telefono && (
              <a href={`tel:${azienda.telefono}`}
                 className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color }}>
                <Phone className="w-4 h-4" /> {azienda.telefono}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        <p className="text-gray-500 text-sm">Caricamento render…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ type }: { type: 'not_found' | 'expired' | 'error' }) {
  const config = {
    not_found: { title: 'Link non trovato', desc: 'Questo link potrebbe essere stato disattivato.' },
    expired: { title: 'Link scaduto', desc: 'Questo link di condivisione è scaduto. Contatta il professionista per uno nuovo.' },
    error: { title: 'Errore', desc: 'Impossibile caricare i dati.' },
  }[type];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3 max-w-sm">
        <ImageOff className="w-12 h-12 text-gray-300 mx-auto" />
        <h1 className="text-xl font-semibold text-gray-700">{config.title}</h1>
        <p className="text-gray-500">{config.desc}</p>
      </div>
    </div>
  );
}
