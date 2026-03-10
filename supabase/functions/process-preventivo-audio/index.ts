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
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY non configurata" }), { status: 500, headers: corsHeaders });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const companyId = formData.get("company_id") as string;
    const cantiereId = formData.get("cantiere_id") as string | null;
    const clienteNome = formData.get("cliente_nome") as string | null;
    const clienteIndirizzo = formData.get("cliente_indirizzo") as string | null;
    const clienteTelefono = formData.get("cliente_telefono") as string | null;
    const clienteEmail = formData.get("cliente_email") as string | null;
    const oggetto = formData.get("oggetto") as string | null;

    if (!audioFile || !companyId) {
      return new Response(JSON.stringify({ error: "audio e company_id richiesti" }), { status: 400, headers: corsHeaders });
    }

    // 1. Upload audio to storage
    const audioPath = `${companyId}/${crypto.randomUUID()}.webm`;
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const audioBytes = await audioFile.arrayBuffer();
    const { error: uploadErr } = await adminClient.storage
      .from("preventivi-audio")
      .upload(audioPath, audioBytes, { contentType: audioFile.type || "audio/webm" });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    // 2. Transcribe with Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", new File([audioBytes], "audio.webm", { type: "audio/webm" }));
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "it");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });
    if (!whisperRes.ok) throw new Error(`Whisper error: ${await whisperRes.text()}`);
    const { text: trascrizione } = await whisperRes.json();

    // 3. Extract quote items with GPT-4o
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Sei un assistente per imprese edili. Dalla trascrizione di un sopralluogo, estrai le voci del preventivo.
Rispondi SOLO in JSON con questo formato:
{
  "voci": [
    { "descrizione": "...", "unita": "mq|ml|nr|ore|forfait", "quantita": 0, "prezzo_unitario": 0, "totale": 0 }
  ],
  "note_generali": "eventuali note dal sopralluogo",
  "oggetto_suggerito": "breve descrizione del lavoro"
}
Se non riesci a determinare quantità o prezzi, metti 0 e l'utente li compilerà dopo.`,
          },
          { role: "user", content: trascrizione },
        ],
      }),
    });
    if (!gptRes.ok) throw new Error(`GPT error: ${await gptRes.text()}`);
    const gptData = await gptRes.json();
    const extracted = JSON.parse(gptData.choices[0].message.content);

    // 4. Calculate totals
    const voci = (extracted.voci || []).map((v: any) => ({
      ...v,
      totale: (v.quantita || 0) * (v.prezzo_unitario || 0),
    }));
    const subtotale = voci.reduce((s: number, v: any) => s + (v.totale || 0), 0);
    const totale = subtotale * 1.22;

    // 5. Generate numero_preventivo
    const year = new Date().getFullYear();
    const { data: seqData } = await adminClient.rpc("nextval", { seq_name: "preventivo_seq" }).single();
    const seqNum = seqData || Date.now();
    const numeroPreventivo = `PREV-${year}-${String(seqNum).padStart(4, "0")}`;

    // 6. Save to DB
    const { data: prev, error: insertErr } = await adminClient
      .from("preventivi")
      .insert({
        company_id: companyId,
        cantiere_id: cantiereId || null,
        numero_preventivo: numeroPreventivo,
        cliente_nome: clienteNome,
        cliente_indirizzo: clienteIndirizzo,
        cliente_telefono: clienteTelefono,
        cliente_email: clienteEmail,
        oggetto: oggetto || extracted.oggetto_suggerito || "Preventivo lavori",
        voci,
        subtotale,
        totale,
        note: extracted.note_generali,
        audio_url: audioPath,
        trascrizione,
        stato: "bozza",
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    return new Response(JSON.stringify(prev), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("process-preventivo-audio error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
