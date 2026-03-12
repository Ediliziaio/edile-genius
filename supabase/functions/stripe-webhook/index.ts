import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
      return new Response("Server misconfigured", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", (err as Error).message);
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;

      if (!meta?.company_id || !meta?.credits_eur) {
        console.error("Missing metadata in checkout session:", session.id);
        return new Response("OK", { status: 200 });
      }

      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Idempotency check
      const { data: existing } = await sb
        .from("ai_credit_topups")
        .select("id")
        .eq("stripe_session_id", session.id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("Already processed session:", session.id);
        return new Response("OK", { status: 200 });
      }

      const creditsEur = Number(meta.credits_eur);
      const companyId = meta.company_id;
      const packageId = meta.package_id || null;
      const userId = meta.user_id || null;
      const packageName = meta.package_name || null;

      // Atomic credit topup
      const { data: newBalanceRows, error: rpcError } = await sb.rpc("topup_credits", {
        _company_id: companyId,
        _amount_eur: creditsEur,
      });

      if (rpcError) {
        console.error("topup_credits RPC error:", rpcError);
        return new Response("RPC error", { status: 500 });
      }

      const newBalance = Number(newBalanceRows);
      const invoiceNum = `EIO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Record topup
      await sb.from("ai_credit_topups").insert({
        company_id: companyId,
        amount_eur: creditsEur,
        type: "stripe",
        status: "completed",
        payment_method: "stripe",
        payment_ref: session.payment_intent as string || null,
        stripe_session_id: session.id,
        package_id: packageId,
        invoice_number: invoiceNum,
        triggered_by: userId,
        notes: packageName ? `Pacchetto: ${packageName} (Stripe)` : "Pagamento Stripe",
        processed_at: new Date().toISOString(),
      });

      // Audit log
      await sb.from("ai_audit_log").insert({
        company_id: companyId,
        user_id: userId,
        action: "credit_topup_stripe",
        entity_type: "credits",
        details: {
          amount_eur: creditsEur,
          new_balance: newBalance,
          invoice: invoiceNum,
          package_id: packageId,
          stripe_session_id: session.id,
        },
      });

      console.log(`✅ Stripe topup: company=${companyId} +€${creditsEur} balance=€${newBalance}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
