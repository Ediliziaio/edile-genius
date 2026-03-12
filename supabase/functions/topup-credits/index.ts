import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { companyId, amountEur, packageId, paymentMethod, paymentRef, type } = await req.json();

    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId richiesto" }), { status: 400, headers: corsHeaders });
    }

    // Verify user belongs to company or is superadmin
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", userId).single();
    const { data: roleCheck } = await sb.from("user_roles").select("role").eq("user_id", userId).limit(1).single();
    const isSuperAdmin = roleCheck?.role === "superadmin" || roleCheck?.role === "superadmin_user";

    if (!isSuperAdmin && profile?.company_id !== companyId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    let finalAmountEur = amountEur;
    let packageName: string | null = null;

    // If packageId is provided, look up package price
    if (packageId) {
      const { data: pkg, error: pkgErr } = await sb
        .from("ai_credit_packages")
        .select("price_eur, credits_eur, name")
        .eq("id", packageId)
        .eq("is_active", true)
        .single();

      if (pkgErr || !pkg) {
        return new Response(
          JSON.stringify({ error: "Pacchetto non trovato o non disponibile" }),
          { status: 404, headers: corsHeaders }
        );
      }
      finalAmountEur = Number(pkg.credits_eur || pkg.price_eur);
      packageName = pkg.name;
    }

    // Validate amount
    if (!finalAmountEur || typeof finalAmountEur !== "number" || finalAmountEur < 5) {
      return new Response(JSON.stringify({ error: "Importo minimo: €5" }), { status: 400, headers: corsHeaders });
    }
    if (finalAmountEur > 2000) {
      return new Response(
        JSON.stringify({ error: "Importo massimo per transazione: €2.000. Per importi maggiori contatta il supporto." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Atomic topup via RPC
    const { data: newBalanceRows, error: rpcError } = await sb.rpc("topup_credits", {
      _company_id: companyId,
      _amount_eur: finalAmountEur,
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), { status: 500, headers: corsHeaders });
    }

    const newBalance = Number(newBalanceRows);

    // Generate invoice number
    const invoiceNum = `EIO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Record topup
    await sb.from("ai_credit_topups").insert({
      company_id: companyId,
      amount_eur: finalAmountEur,
      type: type || (packageId ? "package" : "manual"),
      status: "completed",
      payment_method: paymentMethod || "manual_admin",
      payment_ref: paymentRef || null,
      invoice_number: invoiceNum,
      triggered_by: userId,
      notes: packageName ? `Pacchetto: ${packageName}` : null,
      processed_at: new Date().toISOString(),
    });

    // Audit log
    await sb.from("ai_audit_log").insert({
      company_id: companyId,
      user_id: userId,
      action: "credit_topup",
      entity_type: "credits",
      details: { amount_eur: finalAmountEur, new_balance: newBalance, invoice: invoiceNum, package_id: packageId || null },
    });

    return new Response(JSON.stringify({
      success: true,
      new_balance_eur: Number(newBalance.toFixed(2)),
      amount_added: Number(finalAmountEur.toFixed(2)),
      invoice_number: invoiceNum,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
