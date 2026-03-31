import { useState } from 'react';
import { createPortal } from 'react-dom';
import { VariantiConfigurator } from './VariantiConfigurator';
import { VariantiComparison } from './VariantiComparison';
import { useVariantiGenerator, type VarianteConfig } from '@/hooks/useVariantiGenerator';
import { toast } from 'sonner';

type VariantiStep = 'config' | 'comparison';

interface VariantiModalProps {
  imageBase64: string;
  mimeType: string;
  originalUrl: string;
  basePrompt: string;
  systemPrompt: string;
  naturalWidth: number;
  naturalHeight: number;
  sourceModulo: string;
  sourceSessionId?: string;
  progettoId?: string;
  userId?: string;
  companyId?: string | null;
  onClose: () => void;
  onSaveToProgetto?: (resultUrl: string, varianteName: string) => void;
}

export function VariantiModal({
  imageBase64,
  mimeType,
  originalUrl,
  basePrompt,
  systemPrompt,
  naturalWidth,
  naturalHeight,
  sourceModulo,
  sourceSessionId,
  progettoId,
  userId,
  companyId,
  onClose,
  onSaveToProgetto,
}: VariantiModalProps) {
  const [step, setStep] = useState<VariantiStep>('config');
  const [configuredVarianti, setConfiguredVarianti] = useState<VarianteConfig[]>([]);

  const {
    generating,
    results,
    currentVariante,
    generateVariants,
    setVariantePreferita,
  } = useVariantiGenerator({ sourceModulo, sourceSessionId, progettoId, userId, companyId });

  const handleGenerate = async (varianti: VarianteConfig[]) => {
    setConfiguredVarianti(varianti);
    const res = await generateVariants(
      imageBase64,
      mimeType,
      originalUrl,
      basePrompt,
      systemPrompt,
      varianti,
      naturalWidth,
      naturalHeight,
    );
    if (res && res.length > 0) {
      setStep('comparison');
    } else {
      toast.error('Errore nella generazione delle varianti');
    }
  };

  const handleSavePreferred = async (indice: number) => {
    await setVariantePreferita(indice);
    if (onSaveToProgetto && results[indice]) {
      onSaveToProgetto(results[indice].result_url, results[indice].nome);
      toast.success(`Variante "${results[indice].nome}" salvata nel progetto`);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      {step === 'config' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}

      {step === 'config' ? (
        <div className="relative z-10 max-h-[90vh] overflow-y-auto">
          <VariantiConfigurator
            onGenerate={handleGenerate}
            onCancel={onClose}
            generating={generating}
            currentVariante={currentVariante}
          />
        </div>
      ) : (
        <div className="absolute inset-0 z-10">
          <VariantiComparison
            originalUrl={originalUrl}
            varianti={configuredVarianti}
            results={results}
            onSelectPreferred={(i) => {/* track selection */}}
            onSaveToProgetto={handleSavePreferred}
            onClose={onClose}
          />
        </div>
      )}
    </div>,
    document.body
  );
}
