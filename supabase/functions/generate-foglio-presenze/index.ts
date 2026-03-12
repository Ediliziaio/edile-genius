import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

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

    const { company_id, mese, anno, cantiere_id } = await req.json();
    if (!company_id || !mese || !anno) {
      return new Response(JSON.stringify({ error: "company_id, mese, anno richiesti" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = adminClient
      .from("presenze_mensili")
      .select("*, cantiere_operai(nome, cognome, ruolo), cantieri(nome)")
      .eq("company_id", company_id)
      .eq("mese", mese)
      .eq("anno", anno);

    if (cantiere_id) query = query.eq("cantiere_id", cantiere_id);

    const { data: presenze, error } = await query;
    if (error) throw error;

    // Generate CSV
    const daysInMonth = new Date(anno, mese, 0).getDate();
    const headers = ["Operaio", "Ruolo", "Cantiere"];
    for (let d = 1; d <= daysInMonth; d++) headers.push(String(d));
    headers.push("Totale Ore");

    const rows = (presenze || []).map((p: any) => {
      const operaio = p.cantiere_operai;
      const cantiere = p.cantieri;
      const ore = p.ore_giornaliere || {};
      const row = [
        `${operaio?.nome || ""} ${operaio?.cognome || ""}`.trim(),
        operaio?.ruolo || "",
        cantiere?.nome || "",
      ];
      for (let d = 1; d <= daysInMonth; d++) {
        row.push(String(ore[String(d)] || ""));
      }
      row.push(String(p.ore_totali || 0));
      return row;
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="presenze_${mese}_${anno}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("generate-foglio-presenze error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
