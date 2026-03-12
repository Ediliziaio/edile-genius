import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Get company_id from profile
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
  const companyId = profile?.company_id;
  if (!companyId) {
    return new Response(JSON.stringify({ error: "No company associated" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if company already has data
  const { count } = await serviceClient
    .from("cantieri")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (count && count > 0) {
    return new Response(JSON.stringify({ error: "Account has existing data — seeder skipped" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // 1. Create 2 cantieri
  const { data: cantieri, error: cantErr } = await serviceClient.from("cantieri").insert([
    {
      company_id: companyId,
      nome: "Ristrutturazione Via Garibaldi 14",
      indirizzo: "Via Garibaldi 14, Milano MI",
      committente: "Famiglia Rossi",
      data_inizio: new Date(now - 30 * day).toISOString().split("T")[0],
      data_fine_prevista: new Date(now + 60 * day).toISOString().split("T")[0],
      stato: "attivo",
      responsabile: "Ing. Marco Bianchi",
    },
    {
      company_id: companyId,
      nome: "Nuova costruzione Lotto B - Parco Verde",
      indirizzo: "Via delle Querce, Roma RM",
      committente: "Immobiliare Verde Srl",
      data_inizio: new Date(now - 90 * day).toISOString().split("T")[0],
      data_fine_prevista: new Date(now + 180 * day).toISOString().split("T")[0],
      stato: "attivo",
      responsabile: "Geom. Luigi Verdi",
    },
  ]).select();

  if (cantErr || !cantieri) {
    return new Response(JSON.stringify({ error: "Failed to create cantieri", details: cantErr?.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 2. Create 4 operai
  const { data: operai } = await serviceClient.from("cantiere_operai").insert([
    { company_id: companyId, cantiere_id: cantieri[0].id, nome: "Marco", cognome: "Ferretti", ruolo: "Muratore", telefono: "+393331234567", attivo: true },
    { company_id: companyId, cantiere_id: cantieri[0].id, nome: "Antonio", cognome: "Greco", ruolo: "Idraulico", telefono: "+393335551234", attivo: true },
    { company_id: companyId, cantiere_id: cantieri[1].id, nome: "Luigi", cognome: "Bianchi", ruolo: "Elettricista", telefono: "+393339876543", attivo: true },
    { company_id: companyId, cantiere_id: cantieri[1].id, nome: "Giuseppe", cognome: "Marino", ruolo: "Caposquadra", telefono: "+393334447890", attivo: true },
  ]).select();

  // 3. Create 2 preventivi
  await serviceClient.from("preventivi").insert([
    {
      company_id: companyId,
      cantiere_id: cantieri[0].id,
      numero_preventivo: "PREV-001",
      oggetto: "Preventivo ristrutturazione bagni",
      cliente_nome: "Famiglia Rossi",
      totale: 18500,
      stato: "approvato",
    },
    {
      company_id: companyId,
      numero_preventivo: "PREV-002",
      oggetto: "Preventivo impianto elettrico Lotto B",
      cliente_nome: "Immobiliare Verde Srl",
      totale: 45000,
      stato: "inviato",
    },
  ]);

  // 4. Create 3 documenti scadenza
  await serviceClient.from("documenti_azienda").insert([
    {
      company_id: companyId,
      tipo: "DURC",
      nome: "Documento Unico Regolarità Contributiva",
      data_scadenza: new Date(now + 15 * day).toISOString().split("T")[0],
      stato: "valido",
    },
    {
      company_id: companyId,
      tipo: "Assicurazione RC",
      nome: "Responsabilità Civile cantieri",
      data_scadenza: new Date(now + 45 * day).toISOString().split("T")[0],
      stato: "valido",
    },
    {
      company_id: companyId,
      tipo: "Visura Camerale",
      nome: "Camera di Commercio",
      data_scadenza: new Date(now - 10 * day).toISOString().split("T")[0],
      stato: "scaduto",
    },
  ]);

  return new Response(
    JSON.stringify({
      success: true,
      message: "Dati demo caricati con successo",
      created: { cantieri: cantieri.length, operai: operai?.length ?? 0, preventivi: 2, documenti: 3 },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
