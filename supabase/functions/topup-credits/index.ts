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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { companyId, amountEur, creditsToAdd: clientCreditsToAdd, packageId, paymentMethod, paymentRef, type } = await req.json();

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

    let finalAmountEur: number;
    let finalCreditsEur: number;
    let packageName: string | null = null;

    if (packageId) {
      // packageId has PRIORITY over amountEur
      const { data: pkg, error: pkgErr } = await sb
        .from("ai_credit_packages")
        .select("price_eur, credits_eur, name, is_active")
        .eq("id", packageId)
        .single();

      if (pkgErr || !pkg) {
        return new Response(
          JSON.stringify({ error: "Pacchetto non trovato" }),
          { status: 404, headers: corsHeaders }
        );
      }
      if (!pkg.is_active) {
        return new Response(
          JSON.stringify({ error: "Pacchetto non più disponibile" }),
          { status: 410, headers: corsHeaders }
        );
      }
      finalAmountEur = Number(pkg.price_eur);
      finalCreditsEur = Number(pkg.credits_eur || pkg.price_eur);
      packageName = pkg.name;

    } else if (typeof clientCreditsToAdd === "number" && clientCreditsToAdd > 0) {
      // Superadmin aggiunge crediti diretti (senza passare per €)
      finalAmountEur = clientCreditsToAdd; // registrato come importo per compatibilità
      finalCreditsEur = clientCreditsToAdd;

    } else if (amountEur) {
      if (typeof amountEur !== "number" || amountEur < 1 || amountEur > 100000) {
        return new Response(
          JSON.stringify({ error: "Importo non valido." }),
          { status: 400, headers: corsHeaders }
        );
      }
      finalAmountEur = amountEur;

      // Adjustment da superadmin → 1:1 senza conversione tasso
      if (type === "adjustment") {
        finalCreditsEur = amountEur;
      } else {
        // Acquisto normale → applica tasso configurato
        const { data: platformCfg } = await sb
          .from("platform_config")
          .select("crediti_per_euro")
          .limit(1)
          .single();
        const rate = Number(platformCfg?.crediti_per_euro ?? 10);
        finalCreditsEur = Math.round(amountEur * rate);
      }

    } else {
      return new Response(
        JSON.stringify({ error: "Specifica packageId, creditsToAdd oppure amountEur" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit: max 5 manual topups per company per hour
    const { count: recentCount } = await sb
      .from("ai_credit_topups")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .neq("type", "stripe")
      .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());

    if ((recentCount ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Troppe ricariche nell'ultima ora. Riprova tra qualche minuto." }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Idempotency: reject duplicate topups with the same company + amount within 30s
    // Prevents double-click / network retry from double-crediting.
    const { data: recentDup } = await sb
      .from("ai_credit_topups")
      .select("id, invoice_number, amount_eur")
      .eq("company_id", companyId)
      .eq("amount_eur", finalCreditsEur)
      .in("type", [type || (packageId ? "package" : "manual")])
      .gte("created_at", new Date(Date.now() - 30_000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recentDup) {
      // Return the cached result from the recent duplicate
      return new Response(JSON.stringify({
        success: true,
        new_balance_eur: null, // balance unknown without re-querying
        amount_added: Number(finalCreditsEur.toFixed(2)),
        invoice_number: recentDup.invoice_number,
        deduplicated: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Atomic topup via RPC — use finalCreditsEur (credits to add)
    const { data: newBalanceRows, error: rpcError } = await sb.rpc("topup_credits", {
      _company_id: companyId,
      _amount_eur: finalCreditsEur,
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), { status: 500, headers: corsHeaders });
    }

    const newBalance = Number(newBalanceRows);

    // Generate unique invoice number via DB sequence
    const { data: invoiceData } = await sb.rpc("generate_invoice_number");
    const invoiceNum = invoiceData || `EIO-${Date.now()}`;

    // Record topup
    await sb.from("ai_credit_topups").insert({
      company_id: companyId,
      amount_eur: finalCreditsEur,
      price_paid_eur: finalAmountEur,
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
      details: {
        amount_eur: finalCreditsEur,
        price_paid: finalAmountEur,
        new_balance: newBalance,
        invoice: invoiceNum,
        package_id: packageId || null,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      new_balance_eur: Number(newBalance.toFixed(2)),
      amount_added: Number(finalCreditsEur.toFixed(2)),
      invoice_number: invoiceNum,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
