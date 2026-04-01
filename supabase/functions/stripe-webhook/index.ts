import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

// Webhook server-to-server: nessun CORS necessario
const corsHeaders = {
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {

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

      const companyId = meta.company_id;
      const packageId = meta.package_id || null;
      const userId = meta.user_id || null;
      const packageName = meta.package_name || null;
      const productType = meta.product_type || "ai_credits";

      // Generate unique invoice number via DB sequence
      const { data: invoiceData } = await sb.rpc("generate_invoice_number");
      const invoiceNum = invoiceData || `EIO-${Date.now()}`;

      // ── RENDER CREDITS purchase ─────────────────────────────────────
      if (productType === "render_credits") {
        let renderQty = parseInt(meta.render_quantity || "0", 10);
        if (renderQty <= 0 && packageId) {
          const { data: pkg } = await sb.from("ai_credit_packages")
            .select("render_quantity").eq("id", packageId).single();
          if (pkg) renderQty = Number(pkg.render_quantity);
        }
        if (renderQty <= 0) {
          console.error("[stripe-webhook] Could not determine render quantity:", session.id);
          return new Response("Invalid render quantity", { status: 400 });
        }

        const { data: renderResult, error: renderErr } = await sb.rpc("process_stripe_render_topup", {
          _company_id: companyId,
          _render_quantity: renderQty,
          _price_paid_eur: (session.amount_total || 0) / 100,
          _stripe_session_id: session.id,
          _package_id: packageId,
          _invoice_number: invoiceNum,
          _triggered_by: userId,
          _notes: packageName ? `Pacchetto: ${packageName} (Stripe)` : "Acquisto render Stripe",
        });

        if (renderErr) {
          console.error("[stripe-webhook] process_stripe_render_topup FAILED:", { company_id: companyId, renderQty, error: renderErr.message, session_id: session.id });
          return new Response("Render topup failed - will retry", { status: 500 });
        }

        const rr = Array.isArray(renderResult) ? renderResult[0] : renderResult;
        if (rr?.already_processed) {
          console.log("[stripe-webhook] Render topup already processed (idempotent):", session.id);
          return new Response("OK", { status: 200 });
        }

        // Unlock features associated with this package
        if (packageId) {
          await sb.rpc("unlock_package_features", { _company_id: companyId, _package_id: packageId });
        }

        await sb.from("ai_audit_log").insert({
          company_id: companyId, user_id: userId,
          action: "render_credits_topup_stripe", entity_type: "render_credits",
          details: { render_quantity: renderQty, new_balance: rr?.new_balance, invoice: rr?.invoice_number, package_id: packageId, stripe_session_id: session.id },
        });

        console.log("[stripe-webhook] Render credits added:", { company_id: companyId, render_quantity: renderQty, new_balance: rr?.new_balance });
        return new Response("OK", { status: 200 });
      }

      // ── AI CREDITS purchase (default) ───────────────────────────────
      // Determine credits amount — fallback to package lookup
      let creditsEur = parseFloat(meta.credits_eur || "0");
      if (creditsEur <= 0 && packageId) {
        const { data: pkg } = await sb
          .from("ai_credit_packages")
          .select("credits_eur")
          .eq("id", packageId)
          .single();
        if (pkg) creditsEur = Number(pkg.credits_eur);
      }

      if (creditsEur <= 0) {
        console.error("[stripe-webhook] Could not determine credits amount:", session.id);
        return new Response("Invalid credits amount", { status: 400 });
      }

      // Atomic: insert record + credit wallet in a single DB transaction.
      // Idempotency is handled inside process_stripe_topup via stripe_session_id.
      const { data: topupResult, error: rpcError } = await sb.rpc("process_stripe_topup", {
        _company_id: companyId,
        _credits_eur: creditsEur,
        _price_paid_eur: (session.amount_total || 0) / 100,
        _stripe_session_id: session.id,
        _payment_intent_id: session.payment_intent as string || null,
        _package_id: packageId,
        _invoice_number: invoiceNum,
        _triggered_by: userId,
        _notes: packageName ? `Pacchetto: ${packageName} (Stripe)` : "Pagamento Stripe",
      });

      if (rpcError) {
        console.error("[stripe-webhook] process_stripe_topup FAILED:", {
          company_id: companyId,
          amount: creditsEur,
          error: rpcError.message,
          session_id: session.id,
        });
        return new Response("Credit topup failed - will retry", { status: 500 });
      }

      const result = Array.isArray(topupResult) ? topupResult[0] : topupResult;
      const newBalance = Number(result?.new_balance_eur ?? 0);
      const finalInvoice = result?.invoice_number ?? invoiceNum;

      if (result?.already_processed) {
        console.log("[stripe-webhook] Already processed session (idempotent):", session.id);
        return new Response("OK", { status: 200 });
      }

      // Unlock features associated with this package
      if (packageId) {
        await sb.rpc("unlock_package_features", { _company_id: companyId, _package_id: packageId });
      }

      // Audit log (outside transaction — non-critical)
      await sb.from("ai_audit_log").insert({
        company_id: companyId,
        user_id: userId,
        action: "credit_topup_stripe",
        entity_type: "credits",
        details: {
          amount_eur: creditsEur,
          new_balance: newBalance,
          invoice: finalInvoice,
          package_id: packageId,
          stripe_session_id: session.id,
        },
      });

      console.log("[stripe-webhook] Credits added successfully:", {
        company_id: companyId,
        amount_added: creditsEur,
        new_balance: newBalance,
        invoice: finalInvoice,
      });
    }

    // Gestione abbonamenti modulari
    const MODULE_PRICES: Record<string, { price_eur: number; monthly_units?: number; overage_rate_eur?: number }> = {
      'vocal_s':    { price_eur: 79,  monthly_units: 100,  overage_rate_eur: 0.90 },
      'vocal_m':    { price_eur: 197, monthly_units: 300,  overage_rate_eur: 0.75 },
      'vocal_l':    { price_eur: 497, monthly_units: 1000, overage_rate_eur: 0.55 },
      'preventivi': { price_eur: 29,  monthly_units: 0 },
      'automazioni':{ price_eur: 49,  monthly_units: 0 },
    };

    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const meta = sub.metadata as Record<string, string>;
      if (meta?.company_id && meta?.module) {
        const planConfig = MODULE_PRICES[meta.plan_id || meta.module];
        await sb.from('company_subscriptions').upsert({
          company_id: meta.company_id,
          module: meta.module,
          plan_id: meta.plan_id || null,
          stripe_sub_id: sub.id,
          status: sub.status === 'active' ? 'active' : sub.status,
          monthly_units: planConfig?.monthly_units ?? 0,
          overage_rate_eur: planConfig?.overage_rate_eur ?? 0,
          price_eur: planConfig?.price_eur ?? 0,
          billing_cycle_start: new Date(sub.current_period_start * 1000).toISOString().slice(0,10),
          next_billing_date: new Date(sub.current_period_end * 1000).toISOString().slice(0,10),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,module' });
      }
      return new Response("OK", { status: 200 });
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const meta = sub.metadata as Record<string, string>;
      if (meta?.company_id && meta?.module) {
        await sb.from('company_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', meta.company_id)
          .eq('module', meta.module);
      }
      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[stripe-webhook] Unhandled error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
