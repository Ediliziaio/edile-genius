import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { log, generateRequestId } from '../_shared/utils.ts';

const FN = 'send-credit-alert';
const RESEND_API = 'https://api.resend.com/emails';

Deno.serve(async (req) => {
  const rid = generateRequestId();
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      log('error', 'RESEND_API_KEY not configured', { rid });
      return new Response('Not configured', { status: 503 });
    }

    const { company_id, balance_eur, threshold_pct, days_left } = await req.json();
    if (!company_id) return new Response('company_id required', { status: 400 });

    // Cooldown: non inviare più di 1 alert ogni 24h per azienda
    const { data: credits } = await sb.from('ai_credits')
      .select('alert_email_sent_at, alert_threshold_eur')
      .eq('company_id', company_id).single();

    const lastSent = credits?.alert_email_sent_at
      ? new Date(credits.alert_email_sent_at) : null;
    const cooldownOk = !lastSent ||
      (Date.now() - lastSent.getTime()) > 24 * 60 * 60 * 1000;

    if (!cooldownOk) {
      log('info', 'Alert skipped — cooldown active', { rid, company_id });
      return new Response('cooldown', { status: 200 });
    }

    // Recupera email owner dell'azienda
    const { data: company } = await sb.from('companies')
      .select('name').eq('id', company_id).single();

    const { data: profiles } = await sb.from('profiles')
      .select('email, full_name')
      .eq('company_id', company_id)
      .eq('role', 'owner').limit(1);

    const ownerEmail = profiles?.[0]?.email;
    if (!ownerEmail) {
      log('warn', 'No owner email found', { rid, company_id });
      return new Response('no owner', { status: 200 });
    }

    const balanceFormatted = Number(balance_eur).toFixed(2);
    const urgencyLabel = threshold_pct <= 10 ? '🚨 URGENTE' : '⚠️ Attenzione';
    const daysText = days_left && days_left < 999
      ? `Il tuo agente può gestire circa altri ${days_left} giorni al ritmo attuale.`
      : '';

    const emailBody = {
      from: 'Edile Genius <noreply@edilegenius.io>',
      to: ownerEmail,
      subject: `${urgencyLabel}: crediti vocali in esaurimento — ${company?.name}`,
      html: `
        <h2>${urgencyLabel}: Crediti in esaurimento</h2>
        <p>Ciao ${profiles[0].full_name || 'imprenditore'},</p>
        <p>Il tuo agente AI vocale <strong>${company?.name}</strong> ha solo
        <strong>€${balanceFormatted}</strong> di crediti rimasti.</p>
        <p>${daysText}</p>
        <p>Per evitare interruzioni alle tue chiamate, ricarica subito:</p>
        <a href='https://app.edilegenius.io/app/credits'
          style='background:#E85D04;color:white;padding:12px 24px;
          border-radius:6px;text-decoration:none;font-weight:bold'>
          Ricarica ora →
        </a>
        <p style='color:#6B7280;font-size:12px;margin-top:24px'>
          Ricevi questo avviso perché hai superato la soglia del ${threshold_pct}%.
          Per modificare le soglie: Impostazioni → Crediti.
        </p>`,
    };

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailBody),
    });

    if (!res.ok) {
      const err = await res.text();
      log('error', 'Resend API failed', { rid, company_id, error: err.slice(0, 200) });
      return new Response('email failed', { status: 500 });
    }

    // Aggiorna timestamp DOPO l'invio (non prima)
    await sb.from('ai_credits')
      .update({ alert_email_sent_at: new Date().toISOString() })
      .eq('company_id', company_id);

    log('info', 'Credit alert sent', { rid, company_id, to: ownerEmail });
    return new Response('ok', { status: 200 });

  } catch (err) {
    log('error', `${FN} fatal`, { request_id: rid, error: (err as Error).message });
    return new Response('error', { status: 500 });
  }
});
