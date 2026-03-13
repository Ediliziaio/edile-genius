import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { buildTettoPrompt } from '@/modules/render-tetto/lib/buildPrompt';
import { SYSTEM_PROMPT_TETTO } from '@/modules/render-tetto/lib/systemPrompt';
import { DEFAULT_CONFIG_TETTO } from '@/modules/render-tetto/lib/defaultConfig';
import { useCompanyId } from '@/hooks/useCompanyId';
import type { AnalisiTetto, ConfigurazioneTetto } from '@/modules/render-tetto/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resizeAndConvert(
  file: File,
  maxDim = 1536
): Promise<{ base64: string; width: number; height: number; originalWidth: number; originalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const ow = img.naturalWidth;
      const oh = img.naturalHeight;
      let w = ow, h = oh;
      if (w > maxDim || h > maxDim) {
        const r = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ base64: dataUrl.split(',')[1], width: w, height: h, originalWidth: ow, originalHeight: oh });
    };
    img.onerror = reject;
  });
}

function unwrapEdge<T>(result: any): T {
  const payload = result?.data ?? result;
  if (payload?.error) throw new Error(payload.error);
  return (payload?.data ?? payload) as T;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseRenderTettoOptions {
  onSuccess?: (resultUrl: string) => void;
  onError?: (error: string) => void;
}

export function useRenderTetto(options: UseRenderTettoOptions = {}) {
  const { onSuccess, onError } = options;
  const companyId = useCompanyId();

  // Image state
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Analysis
  const [analizzando, setAnalizzando] = useState(false);
  const [analisi, setAnalisi] = useState<AnalisiTetto | null>(null);

  // Config
  const [tipoTetto, setTipoTetto] = useState<string>('a_falde');
  const [config, setConfig] = useState<ConfigurazioneTetto>(DEFAULT_CONFIG_TETTO);

  // Rendering
  const [rendering, setRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);

  // ── Upload photo ────────────────────────────────────────────────────────────
  const handleFotoChange = useCallback(async (file: File) => {
    if (!companyId) { toast.error('Company non trovata'); return; }

    setFoto(file);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(URL.createObjectURL(file));
    setRenderUrl(null);
    setAnalisi(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      // Create DB session
      const { data: session, error: sessionErr } = await supabase
        .from('render_tetto_sessions')
        .insert({ user_id: user.id, company_id: companyId, original_url: '', status: 'uploading' })
        .select()
        .single();
      if (sessionErr) throw sessionErr;
      setSessionId(session.id);

      // Resize + base64
      const { base64, originalWidth, originalHeight } = await resizeAndConvert(file);
      setImageBase64(base64);
      setImageNaturalWidth(originalWidth);
      setImageNaturalHeight(originalHeight);

      // Upload original
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${session.id}/original.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('tetto-originals')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('tetto-originals').getPublicUrl(path);
      setOriginalUrl(publicUrl);

      // Update session with original URL + dimensions
      await supabase
        .from('render_tetto_sessions')
        .update({ original_url: publicUrl, natural_width: originalWidth, natural_height: originalHeight, status: 'uploaded' })
        .eq('id', session.id);

    } catch (err: any) {
      toast.error('Errore nel caricamento: ' + err.message);
    }
  }, [companyId]);

  // ── AI Analysis ─────────────────────────────────────────────────────────────
  const analizzaTetto = useCallback(async () => {
    if (!imageBase64 || !sessionId) return null;
    setAnalizzando(true);

    try {
      const result = await supabase.functions.invoke('analyze-roof-photo', {
        body: { image_base64: imageBase64, mime_type: 'image/jpeg', session_id: sessionId },
      });
      if (result.error) throw new Error(result.error.message || 'Errore analisi');
      const { analisi: a } = unwrapEdge<{ analisi: AnalisiTetto }>(result.data);
      setAnalisi(a);
      setTipoTetto(a.tipo_tetto);

      // Prefill config from analysis
      setConfig(prev => ({
        ...prev,
        gronde: { ...prev.gronde, colore_hex: a.colore_gronda_hex || prev.gronde.colore_hex },
      }));

      return a;
    } catch (err: any) {
      toast.error('Analisi non riuscita: ' + err.message);
      return null;
    } finally {
      setAnalizzando(false);
    }
  }, [imageBase64, sessionId]);

  // ── Config helpers ──────────────────────────────────────────────────────────
  const updateConfig = useCallback(<K extends keyof ConfigurazioneTetto>(
    section: K,
    updates: Partial<ConfigurazioneTetto[K]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), ...updates },
    }));
  }, []);

  const applyStile = useCallback((stileConfig: Partial<ConfigurazioneTetto>) => {
    setConfig(prev => ({
      ...prev,
      ...stileConfig,
      manto: { ...prev.manto, ...(stileConfig.manto || {}) },
      gronde: { ...prev.gronde, ...(stileConfig.gronde || {}) },
      lucernari: { ...prev.lucernari, ...(stileConfig.lucernari || {}) },
    }));
  }, []);

  // ── Generate render ─────────────────────────────────────────────────────────
  const generaRender = useCallback(async () => {
    if (!imageBase64 || !sessionId) { toast.error('Carica prima una foto del tetto'); return null; }

    const haModifiche = config.manto.attivo || config.gronde.attivo || config.lucernari.attivo || config.note_libere?.trim();
    if (!haModifiche) { toast.error('Seleziona almeno una modifica da applicare'); return null; }

    setRendering(true);

    try {
      const prompt = buildTettoPrompt(config, analisi, tipoTetto);

      // Sync config to DB before invoking
      await supabase
        .from('render_tetto_sessions')
        .update({ config_json: config as any, tipo_tetto: tipoTetto, status: 'rendering' })
        .eq('id', sessionId);

      const result = await supabase.functions.invoke('generate-roof-render', {
        body: {
          image_base64: imageBase64,
          mime_type: 'image/jpeg',
          prompt,
          system_prompt: SYSTEM_PROMPT_TETTO,
          session_id: sessionId,
        },
      });

      // Check for invoke-level errors first
      if (result.error) throw new Error(result.error.message || 'Edge function error');

      const { result_url } = unwrapEdge<{ result_url: string }>(result.data);
      if (!result_url) throw new Error('Nessun risultato ricevuto');

      setRenderUrl(result_url);

      // Save to gallery
      if (companyId) {
        await supabase.from('render_tetto_gallery').insert({
          session_id: sessionId,
          company_id: companyId,
          result_image_url: result_url,
          original_image_url: originalUrl || '',
          config_snapshot: config as any,
        });
      }

      onSuccess?.(result_url);
      toast.success('Render completato!');
      return result_url;
    } catch (err: any) {
      const msg = err.message || 'Errore nella generazione';
      toast.error(msg);
      onError?.(msg);
      return null;
    } finally {
      setRendering(false);
    }
  }, [imageBase64, sessionId, config, analisi, tipoTetto, originalUrl, onSuccess, onError]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setFoto(null);
    setFotoPreview(null);
    setImageBase64('');
    setSessionId(null);
    setAnalisi(null);
    setRenderUrl(null);
    setConfig(DEFAULT_CONFIG_TETTO);
    setTipoTetto('a_falde');
    setOriginalUrl(null);
    setImageNaturalWidth(0);
    setImageNaturalHeight(0);
  }, []);

  // ── Active modifications count ──────────────────────────────────────────────
  const countAttive = useMemo(() =>
    (config.manto.attivo ? 1 : 0) +
    (config.gronde.attivo ? 1 : 0) +
    (config.lucernari.attivo ? 1 : 0) +
    (config.note_libere?.trim() ? 1 : 0),
    [config]
  );

  return {
    foto, fotoPreview, imageBase64, imageNaturalWidth, imageNaturalHeight, originalUrl,
    handleFotoChange,
    sessionId,
    analizzando, analisi, analizzaTetto,
    tipoTetto, setTipoTetto, config, setConfig, updateConfig, applyStile, countAttive,
    rendering, renderUrl, generaRender,
    reset,
  };
}
