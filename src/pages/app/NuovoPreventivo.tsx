import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';

import { StepDatiCliente } from '@/components/preventivo/steps/StepDatiCliente';
import { StepProgetto } from '@/components/preventivo/steps/StepProgetto';
import { StepSuperfici } from '@/components/preventivo/steps/StepSuperfici';
import { StepSezioni } from '@/components/preventivo/steps/StepSezioni';
import { StepVoci } from '@/components/preventivo/steps/StepVoci';
import { StepPDF } from '@/components/preventivo/steps/StepPDF';
import { INITIAL_STATE } from '@/components/preventivo/steps/types';
import type { PreventivoLocalState } from '@/components/preventivo/steps/types';
import type { PreventivoData, TemplateConfig, SezioneContenuto, RenderEntry } from '@/lib/preventivo-pdf';
import type { PreventivoSezione, AnalisiSuperfici } from '@/modules/preventivo/types';
import { SEZIONI_DEFAULT } from '@/modules/preventivo/lib/defaultTemplate';

const STEPS = [
  { label: '👤 Cliente', key: 'cliente' },
  { label: '🎙️ Progetto', key: 'progetto' },
  { label: '📸 Superfici', key: 'superfici' },
  { label: '📝 Contenuti', key: 'contenuti' },
  { label: '💶 Prezzi', key: 'prezzi' },
  { label: '📄 PDF', key: 'pdf' },
];

export default function NuovoPreventivo() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<PreventivoLocalState>(INITIAL_STATE);
  const [preventivoId, setPreventivoId] = useState<string | null>(null);
  const [sezioni, setSezioni] = useState<PreventivoSezione[]>(() => SEZIONI_DEFAULT.map(s => ({ ...s, id: crypto.randomUUID() })));
  const [sezioniContenuto, setSezioniContenuto] = useState<Record<string, SezioneContenuto>>({});
  const [analisi, setAnalisi] = useState<AnalisiSuperfici | null>(null);

  // Load cantiere from URL
  useEffect(() => {
    const cId = searchParams.get('cantiere_id');
    if (cId) setState(prev => ({ ...prev, cantiereId: cId }));
    const pId = searchParams.get('id');
    if (pId) setPreventivoId(pId);
  }, [searchParams]);

  // Load existing preventivo
  useEffect(() => {
    if (!preventivoId) return;
    (async () => {
      const { data } = await (supabase.from('preventivi') as any).select('*').eq('id', preventivoId).single();
      if (!data) return;
      setState(prev => ({
        ...prev,
        clienteNome: data.cliente_nome || '',
        clienteIndirizzo: data.cliente_indirizzo || '',
        clienteTelefono: data.cliente_telefono || '',
        clienteEmail: data.cliente_email || '',
        clientePiva: data.cliente_piva || '',
        clienteCF: data.cliente_codice_fiscale || '',
        cantiereId: data.cantiere_id || '',
        titolo: data.titolo || '',
        oggetto: data.oggetto || '',
        luogoLavori: data.luogo_lavori || '',
        noteInterne: data.note_interne || '',
        renderIds: data.render_ids || [],
        voci: data.voci || [],
        scontoGlobalePerc: data.sconto_globale_percentuale || 0,
        noteGenerali: data.note || '',
        tempiEsecuzione: data.tempi_esecuzione || '',
        fotoAnalisiUrls: data.foto_analisi_urls || [],
      }));
      if (data.sezioni_json) setSezioniContenuto(data.sezioni_json);
      if (data.superfici_stimate) setAnalisi(data.superfici_stimate);
    })();
  }, [preventivoId]);

  // Company + template
  const { data: company } = useQuery({
    queryKey: ['company-info', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('name, address, phone, vat_number').eq('id', companyId!).single();
      return data;
    },
  });

  const { data: templateConfig } = useQuery({
    queryKey: ['preventivo-template', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from('preventivo_templates') as any).select('*').eq('company_id', companyId).maybeSingle();
      return data;
    },
  });

  // Save/create preventivo on step transition
  const saveToDb = useCallback(async () => {
    if (!companyId) return null;
    const subtotaleBruto = Number(state.voci.reduce((s, v) => s + v.totale, 0).toFixed(2));
    const scontoImporto = Number((subtotaleBruto * (state.scontoGlobalePerc / 100)).toFixed(2));
    const imponibile = Number((subtotaleBruto - scontoImporto).toFixed(2));
    const ivaPerc = templateConfig?.iva_percentuale_default || 22;
    const ivaImporto = Number((imponibile * (ivaPerc / 100)).toFixed(2));
    const totale = Number((imponibile + ivaImporto).toFixed(2));

    const payload: Record<string, unknown> = {
      company_id: companyId,
      cliente_nome: state.clienteNome,
      cliente_indirizzo: state.clienteIndirizzo,
      cliente_telefono: state.clienteTelefono,
      cliente_email: state.clienteEmail,
      cliente_piva: state.clientePiva,
      cliente_codice_fiscale: state.clienteCF,
      cantiere_id: state.cantiereId || null,
      titolo: state.titolo,
      oggetto: state.oggetto,
      luogo_lavori: state.luogoLavori,
      note_interne: state.noteInterne,
      render_ids: state.renderIds,
      voci: state.voci,
      subtotale: subtotaleBruto,
      imponibile,
      iva_percentuale: ivaPerc,
      iva_importo: ivaImporto,
      totale,
      totale_finale: totale,
      sconto_globale_percentuale: state.scontoGlobalePerc,
      sconto_globale_importo: scontoImporto,
      note: state.noteGenerali,
      tempi_esecuzione: state.tempiEsecuzione,
      foto_analisi_urls: state.fotoAnalisiUrls,
      sezioni_json: sezioniContenuto,
      stato: 'bozza',
    };

    if (preventivoId) {
      await (supabase.from('preventivi') as any).update(payload).eq('id', preventivoId);
      return preventivoId;
    } else {
      const { data, error } = await (supabase.from('preventivi') as any).insert(payload).select('id').single();
      if (error) { toast.error(error.message); return null; }
      setPreventivoId(data.id);
      toast.success('Preventivo creato');
      return data.id;
    }
  }, [companyId, state, sezioniContenuto, preventivoId, templateConfig]);

  const handleNext = async () => {
    // Validate step 0
    if (step === 0 && !state.clienteNome.trim()) {
      toast.error('Il nome cliente è obbligatorio');
      return;
    }
    // Auto-save on transition
    await saveToDb();
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    if (step === 0) navigate('/app/preventivi');
    else setStep(s => s - 1);
  };

  const handleAudioProcessed = (result: any) => {
    if (result.id) setPreventivoId(result.id);
    setState(prev => ({
      ...prev,
      voci: result.voci || prev.voci,
      noteGenerali: result.note || prev.noteGenerali,
      tempiEsecuzione: result.tempi_esecuzione || prev.tempiEsecuzione,
      oggetto: prev.oggetto || result.oggetto || '',
      titolo: prev.titolo || result.titolo || '',
    }));
  };

  // PDF data
  const subtotaleBruto = Number(state.voci.reduce((s, v) => s + v.totale, 0).toFixed(2));
  const scontoImporto = Number((subtotaleBruto * (state.scontoGlobalePerc / 100)).toFixed(2));
  const imponibile = Number((subtotaleBruto - scontoImporto).toFixed(2));
  const ivaPerc = templateConfig?.iva_percentuale_default || 22;
  const ivaImporto = Number((imponibile * (ivaPerc / 100)).toFixed(2));
  const totaleFinale = Number((imponibile + ivaImporto).toFixed(2));

  const pdfData: PreventivoData = {
    numero_preventivo: preventivoId ? `PV-${preventivoId.slice(0, 6).toUpperCase()}` : 'PV-ANTEPRIMA',
    titolo: state.titolo || state.oggetto || 'Preventivo Lavori',
    oggetto: state.oggetto,
    created_at: new Date().toISOString(),
    luogo_lavori: state.luogoLavori,
    cliente_nome: state.clienteNome,
    cliente_indirizzo: state.clienteIndirizzo,
    cliente_telefono: state.clienteTelefono,
    cliente_email: state.clienteEmail,
    cliente_piva: state.clientePiva,
    cliente_codice_fiscale: state.clienteCF,
    voci: state.voci,
    subtotale: subtotaleBruto,
    sconto_globale_percentuale: state.scontoGlobalePerc,
    sconto_globale_importo: scontoImporto,
    imponibile,
    iva_percentuale: ivaPerc,
    iva_importo: ivaImporto,
    totale_finale: totaleFinale,
    intro: templateConfig?.intro_default,
    condizioni: templateConfig?.condizioni_default,
    clausole: templateConfig?.clausole_default,
    firma_testo: templateConfig?.firma_testo,
    tempi_esecuzione: state.tempiEsecuzione,
    note: state.noteGenerali,
    validita_giorni: state.validitaGiorni,
  };

  const pdfTemplate: TemplateConfig = {
    colore_primario: templateConfig?.colore_primario || '#1a1a2e',
    colore_secondario: templateConfig?.colore_secondario || '#e94560',
    logo_url: templateConfig?.logo_url,
    intestazione_azienda: templateConfig?.intestazione_azienda,
    piede_pagina: templateConfig?.piede_pagina,
    show_foto_copertina: templateConfig?.show_foto_copertina ?? true,
    show_foto_voci: templateConfig?.show_foto_voci ?? true,
    show_subtotali_categoria: templateConfig?.show_subtotali_categoria ?? true,
    show_firma: templateConfig?.show_firma ?? true,
    show_condizioni: templateConfig?.show_condizioni ?? true,
    company_name: company?.name,
    company_address: company?.address || undefined,
    company_phone: company?.phone || undefined,
    company_vat: company?.vat_number || undefined,
    azienda_nome: templateConfig?.azienda_nome,
    azienda_indirizzo: templateConfig?.azienda_indirizzo,
    azienda_telefono: templateConfig?.azienda_telefono,
    azienda_email: templateConfig?.azienda_email,
    azienda_piva: templateConfig?.azienda_piva,
  };

  const stepProps = { state, setState, companyId: companyId || '', preventivoId };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Nuovo Preventivo</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} di {STEPS.length} — {STEPS[step].label}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => i < step && setStep(i)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i < step ? 'bg-primary' : i === step ? 'bg-primary/70' : 'bg-muted'
            } ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="hidden md:flex gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s.key} className={`flex-1 text-center text-xs ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Steps content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <StepDatiCliente {...stepProps} />}
          {step === 1 && <StepProgetto {...stepProps} onAudioProcessed={handleAudioProcessed} />}
          {step === 2 && <StepSuperfici {...stepProps} analisi={analisi} onAnalisi={setAnalisi} />}
          {step === 3 && (
            <StepSezioni
              {...stepProps}
              sezioni={sezioni}
              onSezioniChange={setSezioni}
              sezioniContenuto={sezioniContenuto}
              onContenutoChange={setSezioniContenuto}
            />
          )}
          {step === 4 && <StepVoci {...stepProps} />}
          {step === 5 && (
            <StepPDF
              {...stepProps}
              pdfData={pdfData}
              pdfTemplate={pdfTemplate}
              sezioniContenuto={sezioniContenuto}
              sezioniTemplate={sezioni}
              renderEntries={[]}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < STEPS.length - 1 && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Indietro
          </Button>
          <Button onClick={handleNext} className="flex-1 gap-2" size="lg">
            {step === 0 ? 'Avanti' : 'Salva e Continua'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
