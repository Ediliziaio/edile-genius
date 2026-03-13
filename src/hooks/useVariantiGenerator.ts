import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { unwrapEdge } from '@/lib/edgePayload';

export interface VarianteConfig {
  nome: string;
  colore_hex: string;
  modifica_principale: string;
  prompt_extra: string;
}

export interface VarianteResult {
  nome: string;
  result_url: string;
  variante_index: number;
}

interface UseVariantiGeneratorOptions {
  sourceModulo: string;
  sourceSessionId?: string;
  progettoId?: string;
}

// Map source module to the correct edge function
const MODULE_EDGE_FUNCTION: Record<string, string> = {
  stanza: 'generate-room-render',
  tetto: 'generate-roof-render',
  facciata: 'generate-facade-render',
  bagno: 'generate-bathroom-render',
  pavimento: 'generate-floor-render',
  persiane: 'generate-shutter-render',
  infissi: 'generate-render',
};

export function useVariantiGenerator({ sourceModulo, sourceSessionId }: UseVariantiGeneratorOptions) {
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<VarianteResult[]>([]);
  const [currentVariante, setCurrentVariante] = useState(0);

  const generateVariants = useCallback(async (
    imageBase64: string,
    mimeType: string,
    _originalUrl: string,
    basePrompt: string,
    systemPrompt: string,
    varianti: VarianteConfig[],
    naturalWidth: number,
    naturalHeight: number,
  ): Promise<VarianteResult[] | null> => {
    setGenerating(true);
    setResults([]);
    setCurrentVariante(0);

    const collected: VarianteResult[] = [];

    try {
      for (let i = 0; i < varianti.length; i++) {
        setCurrentVariante(i);
        const v = varianti[i];

        // Combine base prompt with variant-specific instructions
        const combinedPrompt = `${basePrompt}\n\n--- VARIANTE: ${v.nome} ---\n${v.prompt_extra}`;

        const edgeFn = MODULE_EDGE_FUNCTION[sourceModulo] || 'generate-room-render';
        const { data, error } = await supabase.functions.invoke(edgeFn, {
          body: {
            image_base64: imageBase64,
            mime_type: mimeType,
            prompt: combinedPrompt,
            system_prompt: systemPrompt,
            session_id: sourceSessionId ? `${sourceSessionId}-var${i}` : undefined,
            target_width: naturalWidth,
            target_height: naturalHeight,
          },
        });

        if (error) {
          console.error(`Variant ${i} generation failed:`, error);
          continue;
        }

        const payload = unwrapEdge<{ result_url?: string; result_image_url?: string; result_base64?: string }>(data);
        const url = payload?.result_url || payload?.result_image_url || payload?.result_base64 || null;

        if (url) {
          collected.push({
            nome: v.nome,
            result_url: url,
            variante_index: i,
          });
        }
      }

      setCurrentVariante(varianti.length);
      setResults(collected);
      return collected.length > 0 ? collected : null;
    } catch (err) {
      console.error('Variant generation error:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, [sourceSessionId]);

  const setVariantePreferita = useCallback(async (indice: number) => {
    const result = results[indice];
    if (!result) return;

    // Save preferred variant to gallery
    if (sourceSessionId) {
      await supabase.from('render_stanza_gallery' as any).insert({
        session_id: sourceSessionId,
        result_image_url: result.result_url,
        tipo_stanza: 'variante',
        interventi: [`variante_${result.nome}`],
        config_snapshot: { variante: result.nome, source_modulo: sourceModulo },
      });
    }
  }, [results, sourceSessionId, sourceModulo]);

  return {
    generating,
    results,
    currentVariante,
    generateVariants,
    setVariantePreferita,
  };
}
