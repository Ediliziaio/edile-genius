import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

/**
 * Self-service signup provisioning.
 * Called right after signUp() creates the auth.users row.
 * Creates the company + links the profile to it.
 * The handle_new_user trigger already creates the profile + company_user role.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "self-service-signup";

  try {
    const { company_name, user_id, full_name } = await req.json();
    if (!company_name || !user_id) {
      return jsonError("company_name and user_id required", "validation_error", 400, rid);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate slug from company name
    const slug = company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 60) + "-" + Date.now().toString(36);

    // Create company with trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const { data: company, error: companyErr } = await sb
      .from("companies")
      .insert({
        name: company_name,
        slug,
        plan: "trial",
        status: "active",
        trial_ends_at: trialEnd.toISOString(),
        created_by: user_id,
      })
      .select("id")
      .single();

    if (companyErr) {
      log("error", "Failed to create company", { request_id: rid, fn: FN, error: companyErr.message });
      return jsonError(companyErr.message, "system_error", 500, rid);
    }

    // Link profile to company + set as company_admin
    await sb.from("profiles").update({
      company_id: company.id,
      full_name: full_name || null,
    }).eq("id", user_id);

    // Upgrade role to company_admin (trigger already created company_user)
    await sb.from("user_roles").update({ role: "company_admin" }).eq("user_id", user_id);

    // ai_credits are auto-created by init_company_credits trigger on companies insert

    log("info", "Self-service signup completed", {
      request_id: rid, fn: FN,
      company_id: company.id, user_id,
    });

    return jsonOk({ company_id: company.id, slug }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
