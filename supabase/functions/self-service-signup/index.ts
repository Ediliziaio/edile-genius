import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

/**
 * Self-service signup provisioning.
 * Called right after signUp() creates the auth.users row.
 * Creates the company + links the profile to it.
 * The handle_new_user trigger already creates the profile + company_user role.
 *
 * SECURITY: user_id is derived from JWT, not from request body.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "self-service-signup";

  try {
    const { company_name, full_name } = await req.json();
    if (!company_name) {
      return jsonError("company_name required", "validation_error", 400, rid);
    }

    // Derive user_id from JWT (secure)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const user_id = claimsData.claims.sub as string;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already has a company (prevent duplicate provisioning)
    const { data: existingProfile } = await sb.from("profiles").select("company_id").eq("id", user_id).single();
    if (existingProfile?.company_id) {
      return jsonOk({ company_id: existingProfile.company_id, slug: "existing" }, rid);
    }

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
