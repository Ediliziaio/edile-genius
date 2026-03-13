import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) return new Response(JSON.stringify({ error: "Non autorizzato" }), { status: 401, headers: corsHeaders });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader);
    if (authErr || !user) return new Response(JSON.stringify({ error: "Non autorizzato" }), { status: 401, headers: corsHeaders });

    const { company_id, email, ruolo } = await req.json();
    if (!company_id || !email || !ruolo) {
      return new Response(JSON.stringify({ error: "Parametri mancanti" }), { status: 400, headers: corsHeaders });
    }

    // Check caller is admin/owner of this company
    const { data: callerProfile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (callerProfile?.company_id !== company_id) {
      // Check superadmin bypass
      const { data: saRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["superadmin", "superadmin_user"]);
      if (!saRole || saRole.length === 0) {
        return new Response(JSON.stringify({ error: "Accesso negato" }), { status: 403, headers: corsHeaders });
      }
    }

    // Create invite record
    const { data: invite, error: inviteErr } = await supabase
      .from("azienda_inviti")
      .insert({ company_id, email, ruolo, invitato_da: user.id })
      .select()
      .single();

    if (inviteErr) throw inviteErr;

    // Try sending email via Resend (graceful skip if no key)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const { data: company } = await supabase.from("companies").select("name").eq("id", company_id).single();
      const companyName = company?.name || "L'azienda";

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "edilizia.io <noreply@edilizia.io>",
          to: [email],
          subject: `Invito a ${companyName} su edilizia.io`,
          html: `
            <div style="font-family:system-ui;max-width:500px;margin:0 auto;padding:40px 20px">
              <h2>Sei stato invitato!</h2>
              <p>${companyName} ti ha invitato come <strong>${ruolo}</strong> sulla piattaforma edilizia.io.</p>
              <p>Per accettare l'invito, registrati con questa email: <strong>${email}</strong></p>
              <p style="margin-top:24px">
                <a href="https://edilizia.io/signup?invite=${invite.token}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                  Accetta invito
                </a>
              </p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, invite_id: invite.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
