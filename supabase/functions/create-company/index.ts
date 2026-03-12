import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = user.id;

    // Use service role client for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller has superadmin role
    const { data: hasRole } = await supabase.rpc("has_role", {
      _user_id: callerId,
      _role: "superadmin",
    });

    if (!hasRole) {
      const { data: hasSuperadminUser } = await supabase.rpc("has_role", {
        _user_id: callerId,
        _role: "superadmin_user",
      });
      if (!hasSuperadminUser) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { name, slug, sector, plan, admin_email, admin_password, el_api_key, phone, vat_number, address, city, website, trial_ends_at } = body;

    if (!name || !slug || !admin_email || !admin_password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, slug, admin_email, admin_password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name,
        slug,
        sector: sector || null,
        plan: plan || "starter",
        el_api_key: el_api_key || null,
        created_by: callerId,
        status: "active",
        phone: phone || null,
        vat_number: vat_number || null,
        address: address || null,
        city: city || null,
        website: website || null,
        trial_ends_at: trial_ends_at || null,
      })
      .select()
      .single();

    if (companyError) {
      return new Response(JSON.stringify({ error: companyError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
    });

    if (authError) {
      // Rollback company
      await supabase.from("companies").delete().eq("id", company.id);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update profile with company_id
    await supabase
      .from("profiles")
      .update({ company_id: company.id })
      .eq("id", authUser.user.id);

    // 4. Remove default company_user role and add company_admin
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", authUser.user.id)
      .eq("role", "company_user");

    await supabase.from("user_roles").insert({
      user_id: authUser.user.id,
      role: "company_admin",
    });

    return new Response(JSON.stringify({ company, user_id: authUser.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
