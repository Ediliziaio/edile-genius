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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

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
    const clientePiva = formData.get("cliente_piva") as string | null;
    const clienteCF = formData.get("cliente_codice_fiscale") as string | null;
    const oggetto = formData.get("oggetto") as string | null;
    const titolo = formData.get("titolo") as string | null;

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
    whisperForm.append("prompt", "Trascrizione di un sopralluogo edile. Termini: intonaco, ponteggio, calcestruzzo, serramenti, infissi, massetto, cartongesso, impermeabilizzazione, cappotto termico, fotovoltaico.");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });
    if (!whisperRes.ok) throw new Error(`Whisper error: ${await whisperRes.text()}`);
    const { text: trascrizione } = await whisperRes.json();

    // 3. Extract quote items with GPT-4o expert prompt
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Sei un esperto computo-metrista per imprese edili italiane. Dalla trascrizione di un sopralluogo, estrai le voci del preventivo organizzandole per categoria.

REGOLE IMPORTANTI:
- Usa il Prezzario DEI come riferimento per prezzi unitari quando non specificati
- Organizza le voci per CATEGORIA (es: "Demolizioni", "Muratura", "Impianti", "Finiture", "Serramenti")
- Ogni voce deve avere un titolo breve e una descrizione dettagliata
- Stima le quantità in base a ciò che viene descritto (dimensioni stanza, metrature menzionate)
- Se il prezzo non è menzionato, stima un prezzo di mercato realistico per l'Italia
- Includi voci spesso dimenticate: smaltimento macerie, ponteggio, pulizia finale

Rispondi SOLO in JSON con questo formato:
{
  "voci": [
    {
      "id": "uuid-style string",
      "ordine": 1,
      "categoria": "Demolizioni",
      "titolo_voce": "Demolizione pavimento esistente",
      "descrizione": "Rimozione completa del pavimento esistente incluso massetto, con trasporto a discarica autorizzata",
      "unita_misura": "mq",
      "quantita": 25.0,
      "prezzo_unitario": 18.50,
      "sconto_percentuale": 0,
      "totale": 462.50,
      "foto_urls": [],
      "note_voce": "",
      "evidenziata": false
    }
  ],
  "note_generali": "note dal sopralluogo",
  "oggetto_suggerito": "breve titolo dei lavori",
  "tempi_esecuzione_stimati": "es: 15-20 giorni lavorativi",
  "categorie_trovate": ["Demolizioni", "Muratura", "Finiture"]
}

UNITÀ DI MISURA: mq (metri quadri), ml (metri lineari), mc (metri cubi), nr (numero), ore, forfait, kg, cad (cadauno)
Se non riesci a determinare quantità o prezzi, fornisci la migliore stima e metti note_voce con "da verificare".`,
          },
          { role: "user", content: trascrizione },
        ],
      }),
    });
    if (!gptRes.ok) throw new Error(`GPT error: ${await gptRes.text()}`);
    const gptData = await gptRes.json();
    const extracted = JSON.parse(gptData.choices[0].message.content);

    // 4. Process voci with proper calculations
    const voci = (extracted.voci || []).map((v: any, i: number) => ({
      id: v.id || crypto.randomUUID(),
      ordine: v.ordine || i + 1,
      categoria: v.categoria || "Generale",
      titolo_voce: v.titolo_voce || v.descrizione?.substring(0, 50) || "",
      descrizione: v.descrizione || "",
      unita_misura: v.unita_misura || v.unita || "nr",
      quantita: v.quantita || 0,
      prezzo_unitario: v.prezzo_unitario || 0,
      sconto_percentuale: v.sconto_percentuale || 0,
      totale: ((v.quantita || 0) * (v.prezzo_unitario || 0)) * (1 - (v.sconto_percentuale || 0) / 100),
      foto_urls: v.foto_urls || [],
      note_voce: v.note_voce || "",
      evidenziata: v.evidenziata || false,
    }));

    const subtotale = voci.reduce((s: number, v: any) => s + (v.totale || 0), 0);
    const ivaPerc = 22;
    const imponibile = subtotale;
    const ivaImporto = imponibile * (ivaPerc / 100);
    const totaleFinale = imponibile + ivaImporto;

    // 5. Generate numero_preventivo
    const year = new Date().getFullYear();
    let seqNum: number;
    try {
      const { data: seqData } = await adminClient.rpc("nextval", { seq_name: "preventivo_seq" }).single();
      seqNum = seqData || Date.now() % 10000;
    } catch {
      seqNum = Date.now() % 10000;
    }
    const numeroPreventivo = `PV-${year}-${String(seqNum).padStart(3, "0")}`;

    // 6. Calculate scadenza
    const validitaGiorni = 30;
    const dataScadenza = new Date();
    dataScadenza.setDate(dataScadenza.getDate() + validitaGiorni);

    // 7. Save to DB
    const { data: prev, error: insertErr } = await adminClient
      .from("preventivi")
      .insert({
        company_id: companyId,
        cantiere_id: cantiereId || null,
        numero_preventivo: numeroPreventivo,
        titolo: titolo || extracted.oggetto_suggerito || null,
        cliente_nome: clienteNome,
        cliente_indirizzo: clienteIndirizzo,
        cliente_telefono: clienteTelefono,
        cliente_email: clienteEmail,
        cliente_piva: clientePiva,
        cliente_codice_fiscale: clienteCF,
        oggetto: oggetto || extracted.oggetto_suggerito || "Preventivo lavori",
        voci,
        subtotale,
        imponibile,
        iva_percentuale: ivaPerc,
        iva_importo: ivaImporto,
        totale: totaleFinale,
        totale_finale: totaleFinale,
        note: extracted.note_generali,
        tempi_esecuzione: extracted.tempi_esecuzione_stimati,
        validita_giorni: validitaGiorni,
        data_scadenza: dataScadenza.toISOString().split("T")[0],
        audio_url: audioPath,
        trascrizione,
        stato: "bozza",
        versione: 1,
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
