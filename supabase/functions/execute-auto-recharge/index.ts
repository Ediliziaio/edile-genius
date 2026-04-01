import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { log, generateRequestId } from '../_shared/utils.ts';

const FN = 'execute-auto-recharge';

Deno.serve(async (req) => {
  const rid = generateRequestId();
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia'
    });

    const { company_id, amount_eur } = await req.json();
    if (!company_id || !amount_eur) {
      return new Response('company_id e amount_eur richiesti', { status: 400 });
    }

    // Recupera Stripe customer e payment method salvati
    const { data: credits } = await sb.from('ai_credits')
      .select('stripe_customer_id, stripe_payment_method_id, auto_recharge_enabled, balance_eur')
      .eq('company_id', company_id).single();

    if (!credits?.auto_recharge_enabled) {
      log('info', 'Auto-recharge disabled for company', { rid, company_id });
      return new Response('disabled', { status: 200 });
    }

    if (!credits.stripe_customer_id || !credits.stripe_payment_method_id) {
      log('warn', 'No saved payment method — cannot auto-recharge', { rid, company_id });
      // Invia email 'aggiungi metodo di pagamento'
      await sb.functions.invoke('send-credit-alert', {
        body: { company_id, balance_eur: credits.balance_eur, threshold_pct: 0, days_left: 0 }
      });
      return new Response('no_payment_method', { status: 200 });
    }

    // Anti-race: verifica che non sia già stata effettuata una ricarica negli ultimi 5 min
    const { data: recentRecharge } = await sb.from('ai_credit_topups')
      .select('id').eq('company_id', company_id).eq('type', 'auto')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1).maybeSingle();

    if (recentRecharge) {
      log('info', 'Auto-recharge already ran — skipping', { rid, company_id });
      return new Response('already_ran', { status: 200 });
    }

    // Crea il pagamento Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount_eur * 100),
      currency: 'eur',
      customer: credits.stripe_customer_id,
      payment_method: credits.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      metadata: { company_id, type: 'auto_recharge', amount_eur: String(amount_eur) },
    });

    if (paymentIntent.status !== 'succeeded') {
      log('error', 'Auto-recharge payment failed', { rid, company_id, status: paymentIntent.status });
      return new Response('payment_failed', { status: 500 });
    }

    // Accredita i crediti atomicamente
    const { data: invoiceData } = await sb.rpc('generate_invoice_number');
    const { error: rpcError } = await sb.rpc('process_stripe_topup', {
      _company_id: company_id,
      _credits_eur: amount_eur,
      _price_paid_eur: amount_eur,
      _stripe_session_id: paymentIntent.id,
      _payment_intent_id: paymentIntent.id,
      _package_id: null,
      _invoice_number: invoiceData || `AUTO-${Date.now()}`,
      _triggered_by: null,
      _notes: `Ricarica automatica €${amount_eur}`,
    });

    if (rpcError) {
      log('error', 'process_stripe_topup failed after payment', { rid, error: rpcError.message });
      // CRITICO: il pagamento è avvenuto ma i crediti non sono stati accreditati
      // Loggare per reconciliation manuale
      await sb.from('ai_audit_log').insert({
        company_id,
        action: 'auto_recharge_reconciliation_needed',
        details: { payment_intent_id: paymentIntent.id, amount_eur, error: rpcError.message }
      });
      return new Response('credits_not_added', { status: 500 });
    }

    log('info', 'Auto-recharge completed', { rid, company_id, amount_eur });
    return new Response('ok', { status: 200 });

  } catch (err: unknown) {
    log('error', `${FN} fatal`, { error: (err as Error).message });
    return new Response('error', { status: 500 });
  }
});
