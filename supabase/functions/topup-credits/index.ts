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

    const { companyId, amountEur, paymentMethod, paymentRef, type } = await req.json();

    if (!companyId || !amountEur || amountEur < 5) {
      return new Response(JSON.stringify({ error: "Invalid input. Min €5." }), { status: 400, headers: corsHeaders });
    }

    // Verify user belongs to company or is superadmin
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", userId).single();
    const { data: roleCheck } = await sb.from("user_roles").select("role").eq("user_id", userId).limit(1).single();
    const isSuperAdmin = roleCheck?.role === "superadmin" || roleCheck?.role === "superadmin_user";

    if (!isSuperAdmin && profile?.company_id !== companyId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Get current balance
    const { data: credits } = await sb
      .from("ai_credits")
      .select("balance_eur, calls_blocked, blocked_reason")
      .eq("company_id", companyId)
      .single();

    const currentBalance = Number(credits?.balance_eur || 0);
    const newBalance = Number((currentBalance + amountEur).toFixed(4));

    // Update balance
    const updateData: Record<string, unknown> = {
      balance_eur: newBalance,
      total_recharged_eur: sb.rpc ? undefined : newBalance, // fallback
      updated_at: new Date().toISOString(),
    };

    // Unblock if was blocked due to zero balance
    if (credits?.calls_blocked && credits?.blocked_reason === "balance_zero") {
      updateData.calls_blocked = false;
      updateData.blocked_at = null;
      updateData.blocked_reason = null;
    }

    await sb.from("ai_credits").update(updateData).eq("company_id", companyId);

    // We also need to increment total_recharged_eur separately
    // Since we can't use raw SQL, read and set
    const { data: freshCredits } = await sb
      .from("ai_credits")
      .select("total_recharged_eur")
      .eq("company_id", companyId)
      .single();

    await sb.from("ai_credits").update({
      total_recharged_eur: Number(((freshCredits?.total_recharged_eur || 0) as number) + amountEur).toFixed(4),
    }).eq("company_id", companyId);

    // Generate invoice number
    const invoiceNum = `EIO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Record topup
    await sb.from("ai_credit_topups").insert({
      company_id: companyId,
      amount_eur: amountEur,
      type: type || "manual",
      status: "completed",
      payment_method: paymentMethod || "manual_admin",
      payment_ref: paymentRef || null,
      invoice_number: invoiceNum,
      triggered_by: userId,
      processed_at: new Date().toISOString(),
    });

    // Audit log
    await sb.from("ai_audit_log").insert({
      company_id: companyId,
      user_id: userId,
      action: "credit_topup",
      entity_type: "credits",
      details: { amount_eur: amountEur, new_balance: newBalance, invoice: invoiceNum },
    });

    return new Response(JSON.stringify({
      success: true,
      new_balance_eur: newBalance,
      invoice_number: invoiceNum,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
