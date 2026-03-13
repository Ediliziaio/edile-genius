import type { PreventivoVoce } from '@/lib/preventivo-pdf';

export interface PreventivoLocalState {
  // Client data
  clienteNome: string;
  clienteIndirizzo: string;
  clienteTelefono: string;
  clienteEmail: string;
  clientePiva: string;
  clienteCF: string;
  // Project
  cantiereId: string;
  titolo: string;
  oggetto: string;
  luogoLavori: string;
  validitaGiorni: number;
  noteInterne: string;
  renderIds: string[];
  // Voci
  voci: PreventivoVoce[];
  scontoGlobalePerc: number;
  noteGenerali: string;
  tempiEsecuzione: string;
  // Photos for surface analysis
  fotoAnalisiUrls: string[];
}

export interface StepProps {
  state: PreventivoLocalState;
  setState: React.Dispatch<React.SetStateAction<PreventivoLocalState>>;
  companyId: string;
  preventivoId: string | null;
}

export const INITIAL_STATE: PreventivoLocalState = {
  clienteNome: '',
  clienteIndirizzo: '',
  clienteTelefono: '',
  clienteEmail: '',
  clientePiva: '',
  clienteCF: '',
  cantiereId: '',
  titolo: '',
  oggetto: '',
  luogoLavori: '',
  validitaGiorni: 30,
  noteInterne: '',
  renderIds: [],
  voci: [],
  scontoGlobalePerc: 0,
  noteGenerali: '',
  tempiEsecuzione: '',
  fotoAnalisiUrls: [],
};
