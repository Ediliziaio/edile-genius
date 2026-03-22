import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe non configurato. Contatta l'amministratore.", code: "stripe_not_configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { packageId, companyId, successUrl, cancelUrl } = await req.json();

    if (!packageId || !companyId) {
      return new Response(JSON.stringify({ error: "packageId e companyId richiesti" }), { status: 400, headers: corsHeaders });
    }

    // Verify user belongs to company
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", userId).single();
    const { data: roleCheck } = await sb.from("user_roles").select("role").eq("user_id", userId).limit(1).single();
    const isSuperAdmin = roleCheck?.role === "superadmin" || roleCheck?.role === "superadmin_user";

    if (!isSuperAdmin && profile?.company_id !== companyId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Get package (including render fields)
    const { data: pkg, error: pkgErr } = await sb
      .from("ai_credit_packages")
      .select("id, name, price_eur, credits_eur, stripe_price_id, product_type, render_quantity")
      .eq("id", packageId)
      .eq("is_active", true)
      .single();

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: "Pacchetto non trovato" }), { status: 404, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    // Use existing stripe_price_id or create one-time price
    let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

    const isRenderPackage = pkg.product_type === "render_credits";

    if (pkg.stripe_price_id) {
      lineItem = { price: pkg.stripe_price_id, quantity: 1 };
    } else {
      lineItem = {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(pkg.price_eur) * 100),
          product_data: {
            name: isRenderPackage
              ? `${pkg.name} — Render EdileGenius`
              : `${pkg.name} — Crediti EdileGenius`,
            description: isRenderPackage
              ? `${pkg.render_quantity} render AI inclusi`
              : `€${Number(pkg.credits_eur || pkg.price_eur).toFixed(0)} di crediti conversazionali`,
          },
        },
        quantity: 1,
      };
    }

    const metadata: Record<string, string> = {
      company_id: companyId,
      package_id: packageId,
      user_id: userId,
      package_name: pkg.name,
      product_type: pkg.product_type || "ai_credits",
    };
    if (isRenderPackage) {
      metadata.render_quantity = String(pkg.render_quantity || 0);
    } else {
      metadata.credits_eur = String(pkg.credits_eur || pkg.price_eur);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      metadata,
      success_url: successUrl || `${req.headers.get("origin")}/app/credits?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/app/credits?payment=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-checkout-session] Error:", err);

    const headers = { ...corsHeaders, "Content-Type": "application/json" };

    if (err?.type === "StripeAuthenticationError") {
      return new Response(JSON.stringify({
        error: "Configurazione pagamenti non valida. Contatta il supporto.",
        code: "stripe_auth_error",
      }), { status: 500, headers });
    }

    if (err?.type === "StripeInvalidRequestError") {
      return new Response(JSON.stringify({
        error: "Richiesta di pagamento non valida. Riprova.",
        code: "stripe_invalid_request",
      }), { status: 400, headers });
    }

    if (err?.code === "ECONNREFUSED" || err?.message?.includes("fetch")) {
      return new Response(JSON.stringify({
        error: "Servizio pagamenti temporaneamente non disponibile. Riprova tra qualche minuto.",
        code: "stripe_unavailable",
      }), { status: 503, headers });
    }

    return new Response(JSON.stringify({
      error: "Si è verificato un errore. Riprova o contatta il supporto.",
      code: "unknown_error",
    }), { status: 500, headers });
  }
});
