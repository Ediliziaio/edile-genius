import type { Tables } from "@/integrations/supabase/types";

/* ── Types ─────────────────────────────────────────── */

export interface ScoreFactor {
  id: string;
  label: string;
  weight: number;
  achieved: boolean;
  isBlocker: boolean;
  action?: string; // suggested action when not achieved
}

export type ScoreLabel = "Da completare" | "Quasi pronto" | "Pronto" | "Eccellente";

export interface AgentScoreResult {
  score: number;
  label: ScoreLabel;
  colorClass: string;       // tailwind text class
  bgClass: string;          // tailwind bg class
  factors: ScoreFactor[];
  blockers: string[];        // labels of unmet blockers
  hasBlockers: boolean;
}

/* ── Helpers ───────────────────────────────────────── */

function tierFromScore(score: number): { label: ScoreLabel; colorClass: string; bgClass: string } {
  if (score >= 90) return { label: "Eccellente", colorClass: "text-brand", bgClass: "bg-brand-light" };
  if (score >= 70) return { label: "Pronto", colorClass: "text-status-success", bgClass: "bg-status-success-light" };
  if (score >= 40) return { label: "Quasi pronto", colorClass: "text-status-warning", bgClass: "bg-status-warning-light" };
  return { label: "Da completare", colorClass: "text-destructive", bgClass: "bg-destructive/10" };
}

/* ── Main scoring function ─────────────────────────── */

export function computeAgentScore(agent: Tables<"agents">): AgentScoreResult {
  const type = agent.type || "vocal";
  const isVocal = type === "vocal";
  const isWhatsapp = type === "whatsapp";
  const isVocalOrWA = isVocal || isWhatsapp;

  const factors: ScoreFactor[] = [];

  // 1. Name filled (5)
  factors.push({
    id: "name",
    label: "Nome compilato",
    weight: 5,
    achieved: !!agent.name && agent.name.trim().length > 0,
    isBlocker: false,
    action: "Assegna un nome all'agente",
  });

  // 2. Description filled (5)
  factors.push({
    id: "description",
    label: "Descrizione presente",
    weight: 5,
    achieved: !!agent.description && agent.description.trim().length > 0,
    isBlocker: false,
    action: "Aggiungi una descrizione per identificare lo scopo dell'agente",
  });

  // 3. System prompt ≥ 50 chars (20) — blocker for vocal/whatsapp
  factors.push({
    id: "system_prompt",
    label: "System prompt configurato",
    weight: 20,
    achieved: !!agent.system_prompt && agent.system_prompt.length >= 50,
    isBlocker: isVocalOrWA,
    action: "Scrivi un system prompt di almeno 50 caratteri",
  });

  // 4. First message filled (10) — vocal/whatsapp only
  if (isVocalOrWA) {
    factors.push({
      id: "first_message",
      label: "Primo messaggio impostato",
      weight: 10,
      achieved: !!agent.first_message && agent.first_message.trim().length > 0,
      isBlocker: false,
      action: "Configura il primo messaggio che l'agente invierà",
    });
  }

  // 5. Voice selected (15) — vocal only, blocker
  if (isVocal) {
    factors.push({
      id: "voice",
      label: "Voce selezionata",
      weight: 15,
      achieved: !!agent.el_voice_id,
      isBlocker: true,
      action: "Seleziona una voce dalla libreria ElevenLabs",
    });
  }

  // 6. ElevenLabs agent synced (10) — vocal only, blocker
  if (isVocal) {
    factors.push({
      id: "el_sync",
      label: "Sincronizzato con ElevenLabs",
      weight: 10,
      achieved: !!agent.el_agent_id,
      isBlocker: true,
      action: "Pubblica l'agente per sincronizzarlo con ElevenLabs",
    });
  }

  // 7. Sector set (5)
  factors.push({
    id: "sector",
    label: "Settore assegnato",
    weight: 5,
    achieved: !!agent.sector && agent.sector.trim().length > 0,
    isBlocker: false,
    action: "Seleziona il settore di riferimento",
  });

  // 8. Has conversations (10) — vocal/whatsapp
  if (isVocalOrWA) {
    factors.push({
      id: "conversations",
      label: "Ha ricevuto conversazioni",
      weight: 10,
      achieved: (agent.calls_total ?? 0) > 0,
      isBlocker: false,
      action: "Effettua almeno una conversazione di test",
    });
  }

  // 9. Phone number assigned (10) — vocal with outbound
  if (isVocal) {
    factors.push({
      id: "phone",
      label: "Numero telefonico assegnato",
      weight: 10,
      achieved: !!agent.el_phone_number_id || !!agent.phone_number_id,
      isBlocker: false,
      action: "Assegna un numero telefonico dall'area Telefono",
    });
  }

  // 10. Webhook configured (5)
  factors.push({
    id: "webhook",
    label: "Webhook configurato",
    weight: 5,
    achieved: !!agent.webhook_url && agent.webhook_url.trim().length > 0,
    isBlocker: false,
    action: "Configura un webhook per ricevere eventi",
  });

  // 11. Evaluation criteria set (5) — vocal/whatsapp
  if (isVocalOrWA) {
    factors.push({
      id: "evaluation",
      label: "Criteri di valutazione definiti",
      weight: 5,
      achieved: !!agent.evaluation_criteria && agent.evaluation_criteria.trim().length > 0,
      isBlocker: false,
      action: "Definisci i criteri per valutare le conversazioni",
    });
  }

  // Calculate score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const achievedWeight = factors.reduce((sum, f) => sum + (f.achieved ? f.weight : 0), 0);
  const score = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;

  const blockers = factors.filter(f => f.isBlocker && !f.achieved).map(f => f.label);
  const tier = tierFromScore(score);

  return {
    score,
    label: tier.label,
    colorClass: tier.colorClass,
    bgClass: tier.bgClass,
    factors,
    blockers,
    hasBlockers: blockers.length > 0,
  };
}
