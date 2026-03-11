/**
 * Lead Score Engine — calcola un punteggio 0-100 per ogni contatto
 * basato su segnali reali dalle conversazioni e dai dati del contatto.
 * Nessun LLM: pura logica JavaScript.
 */

export interface LeadScoreWeights {
  qualified_outcome?: number;   // default 30
  positive_sentiment?: number;  // default 20
  complete_contact?: number;    // default 10
  has_calls?: number;           // default 10
  inbound_source?: number;      // default 5
  recency_bonus?: number;       // default 10
}

export interface LeadScoreInput {
  // Contact fields
  status: string;
  priority?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  call_attempts?: number | null;
  last_contact_at?: string | null;
  // Conversation signals (pre-aggregated)
  hasQualifiedOrAppointment?: boolean;
  hasPositiveSentiment?: boolean;
  latestOutcome?: string | null;
  conversationCount?: number;
  // Preventivo signals
  hasPreventivo?: boolean;
  // Custom weights from company settings (Qualificatore Intelligente)
  customWeights?: LeadScoreWeights | null;
}

export interface LeadScoreResult {
  score: number;
  label: "Caldo" | "Tiepido" | "Freddo";
  color: string;       // tailwind text color class
  bgColor: string;     // tailwind bg class
  emoji: string;
  factors: string[];   // human-readable factors that influenced the score
}

export function calculateLeadScore(input: LeadScoreInput): LeadScoreResult {
  let score = 30; // base score
  const factors: string[] = [];

  // +30 qualified or appointment outcome
  if (input.hasQualifiedOrAppointment) {
    score += 30;
    factors.push("Esito qualificato o appuntamento");
  }

  // +20 positive sentiment
  if (input.hasPositiveSentiment) {
    score += 20;
    factors.push("Sentiment positivo");
  }

  // +15 ha un preventivo
  if (input.hasPreventivo) {
    score += 15;
    factors.push("Preventivo associato");
  }

  // +10 contatto completo (telefono + email)
  if (input.phone && input.email) {
    score += 10;
    factors.push("Contatto completo");
  }

  // +10 richiamato almeno una volta
  if ((input.call_attempts ?? 0) > 0) {
    score += 10;
    factors.push(`${input.call_attempts} tentativo/i di chiamata`);
  }

  // +5 fonte inbound
  if (input.source === "web_form" || input.source === "referral") {
    score += 5;
    factors.push("Lead inbound");
  }

  // -10 ultima interazione > 30 giorni fa
  if (input.last_contact_at) {
    const daysSince = Math.floor((Date.now() - new Date(input.last_contact_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      score -= 10;
      factors.push(`Ultimo contatto ${daysSince}g fa`);
    }
  }

  // -20 not_interested
  if (input.latestOutcome === "not_interested") {
    score -= 20;
    factors.push("Non interessato");
  }

  // -30 do_not_call or invalid
  if (input.status === "do_not_call" || input.status === "invalid") {
    score -= 30;
    factors.push("Non contattabile");
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  let label: LeadScoreResult["label"];
  let color: string;
  let bgColor: string;
  let emoji: string;

  if (score > 60) {
    label = "Caldo";
    color = "text-red-600";
    bgColor = "bg-red-50";
    emoji = "🔴";
  } else if (score > 30) {
    label = "Tiepido";
    color = "text-amber-600";
    bgColor = "bg-amber-50";
    emoji = "🟠";
  } else {
    label = "Freddo";
    color = "text-blue-500";
    bgColor = "bg-blue-50";
    emoji = "🔵";
  }

  return { score, label, color, bgColor, emoji, factors };
}
