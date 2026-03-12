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
      console.error("[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
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
      console.error("[stripe-webhook] Signature verification failed:", (err as Error).message);
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;

      console.log("[stripe-webhook] Event received:", {
        type: event.type,
        session_id: session.id,
        company_id: meta?.company_id,
        credits_eur: meta?.credits_eur,
        package_id: meta?.package_id,
        timestamp: new Date().toISOString(),
      });

      // Validate metadata — return 400 so Stripe retries
      if (!meta?.company_id) {
        console.error("[stripe-webhook] Missing company_id in metadata:", session.id);
        return new Response("Missing company_id in metadata", { status: 400 });
      }

      if (!meta?.credits_eur && !meta?.package_id) {
        console.error("[stripe-webhook] Missing credits_eur and package_id in metadata:", session.id);
        return new Response("Missing credits metadata", { status: 400 });
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
        console.log("[stripe-webhook] Already processed session:", session.id);
        return new Response("OK", { status: 200 });
      }

      // Determine credits amount — fallback to package lookup
      let creditsEur = parseFloat(meta.credits_eur || "0");
      if (creditsEur <= 0 && meta.package_id) {
        const { data: pkg } = await sb
          .from("ai_credit_packages")
          .select("credits_eur")
          .eq("id", meta.package_id)
          .single();
        if (pkg) creditsEur = Number(pkg.credits_eur);
      }

      if (creditsEur <= 0) {
        console.error("[stripe-webhook] Could not determine credits amount:", session.id);
        return new Response("Invalid credits amount", { status: 400 });
      }

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
        console.error("[stripe-webhook] RPC topup_credits FAILED:", {
          company_id: companyId,
          amount: creditsEur,
          error: rpcError.message,
          session_id: session.id,
        });
        return new Response("Credit topup failed - will retry", { status: 500 });
      }

      const newBalance = Number(newBalanceRows);

      // Generate unique invoice number via DB sequence
      const { data: invoiceData } = await sb.rpc("generate_invoice_number");
      const invoiceNum = invoiceData || `EIO-${Date.now()}`;

      // Record topup
      await sb.from("ai_credit_topups").insert({
        company_id: companyId,
        amount_eur: creditsEur,
        price_paid_eur: (session.amount_total || 0) / 100,
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

      console.log("[stripe-webhook] Credits added successfully:", {
        company_id: companyId,
        amount_added: creditsEur,
        new_balance: newBalance,
        invoice: invoiceNum,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[stripe-webhook] Unhandled error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
