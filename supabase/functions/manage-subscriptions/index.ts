import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { corsHeaders, generateRequestId, log, jsonOk, jsonError } from '../_shared/utils.ts';

const MODULE_PRICES: Record<string, {
  price_eur: number;
  stripe_price_id?: string;
  monthly_units?: number;
  overage_rate_eur?: number;
}> = {
  'vocal_s':    { price_eur: 79,  monthly_units: 100,  overage_rate_eur: 0.90 },
  'vocal_m':    { price_eur: 197, monthly_units: 300,  overage_rate_eur: 0.75 },
  'vocal_l':    { price_eur: 497, monthly_units: 1000, overage_rate_eur: 0.55 },
  'preventivi': { price_eur: 29,  monthly_units: 0 }, // 0 = illimitato (flat)
  'automazioni':{ price_eur: 49,  monthly_units: 0 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer '))
      return jsonError('Unauthorized', 'auth_error', 401, rid);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (!user) return jsonError('Unauthorized', 'auth_error', 401, rid);

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, module, plan_id, company_id } = await req.json();

    // Validazione tenant
    const { data: profile } = await sb.from('profiles')
      .select('company_id').eq('id', user.id).single();

    if (profile?.company_id !== company_id)
      return jsonError('Forbidden', 'auth_error', 403, rid);

    if (action === 'activate') {
      const planKey = plan_id || module;
      const planConfig = MODULE_PRICES[planKey];
      if (!planConfig) return jsonError('Piano non valido', 'validation_error', 400, rid);

      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
        apiVersion: '2024-12-18.acacia'
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price_data: {
          currency: 'eur',
          unit_amount: Math.round(planConfig.price_eur * 100),
          recurring: { interval: 'month' },
          product_data: { name: `Edile Genius — Modulo ${module}` },
        }, quantity: 1 }],
        metadata: { company_id, module, plan_id: planKey, user_id: user.id },
        success_url: `${req.headers.get('origin')}/app/settings?module_activated=${module}`,
        cancel_url: `${req.headers.get('origin')}/app/settings?module_cancelled=${module}`,
      });

      return jsonOk({ url: session.url }, rid);
    }

    if (action === 'deactivate') {
      const { data: sub } = await sb.from('company_subscriptions')
        .select('stripe_sub_id')
        .eq('company_id', company_id)
        .eq('module', module)
        .single();

      if (sub?.stripe_sub_id) {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
          apiVersion: '2024-12-18.acacia'
        });
        await stripe.subscriptions.cancel(sub.stripe_sub_id);
      }

      await sb.from('company_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('company_id', company_id)
        .eq('module', module);

      return jsonOk({ cancelled: true }, rid);
    }

    return jsonError('action non valida', 'validation_error', 400, rid);

  } catch (err) {
    log('error', 'manage-subscriptions fatal', { error: (err as Error).message });
    return new Response('error', { status: 500, headers: corsHeaders });
  }
});
