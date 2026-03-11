import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "process-preventivo-audio";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return jsonError("OPENAI_API_KEY non configurata", "system_error", 500, rid);

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

    if (!audioFile || !companyId) return jsonError("audio e company_id richiesti", "validation_error", 400, rid);

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Upload audio
    const audioPath = `${companyId}/${crypto.randomUUID()}.webm`;
    const audioBytes = await audioFile.arrayBuffer();
    const { error: uploadErr } = await adminClient.storage.from("preventivi-audio").upload(audioPath, audioBytes, { contentType: audioFile.type || "audio/webm" });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    // 2. Transcribe with Whisper (60s timeout)
    const whisperForm = new FormData();
    whisperForm.append("file", new File([audioBytes], "audio.webm", { type: "audio/webm" }));
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "it");
    whisperForm.append("prompt", "Trascrizione di un sopralluogo edile. Termini: intonaco, ponteggio, calcestruzzo, serramenti, infissi, massetto, cartongesso, impermeabilizzazione, cappotto termico, fotovoltaico, demolizione, massetto, piastrelle, tubazioni.");

    const whisperRes = await fetchWithTimeout("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    }, 60_000);
    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      log("error", "Whisper transcription failed", { request_id: rid, fn: FN, status: whisperRes.status });
      throw new Error(`Whisper error: ${whisperRes.status}`);
    }
    const { text: trascrizione } = await whisperRes.json();

    // 3. GPT-4o structuring (90s timeout)
    const systemPrompt = `Sei un geometra esperto e preventivista in edilizia italiana con 20 anni di esperienza. Analizza la trascrizione di un sopralluogo e produci le voci di un preventivo professionale.

ISTRUZIONI:
- Identifica TUTTE le lavorazioni menzionate, anche implicitamente
- Suddividi in categorie logiche: Demolizioni, Muratura, Strutture, Impianto Idraulico, Impianto Elettrico, Pavimenti e Rivestimenti, Intonaci e Pitture, Serramenti e Infissi, Opere Esterne, Finiture, Materiali, Manodopera
- Per le quantità: usa le misure menzionate nell'audio; se non specificate, stima ragionevolmente
- Per i prezzi: usa prezzari DEI 2025 per l'Italia (prezzi medi nazionali)
- Sii MOLTO preciso nelle descrizioni
- Ordina le voci in sequenza logica di esecuzione lavori
- Includi voci spesso dimenticate: smaltimento macerie, ponteggio, pulizia finale

FORMATO OUTPUT (JSON puro):
{
  "titolo": "Titolo sintetico e professionale dei lavori",
  "oggetto": "Frase formale tipo 'Lavori di ristrutturazione appartamento sito in...'",
  "luogo_lavori": "indirizzo o descrizione luogo se menzionato",
  "tempi_esecuzione": "stima realistica in settimane/mesi",
  "intro_suggerita": "breve introduzione professionale",
  "voci": [{"id": "v1", "ordine": 1, "categoria": "Demolizioni", "titolo_voce": "Rimozione pavimento esistente", "descrizione": "Demolizione e rimozione...", "unita_misura": "mq", "quantita": 45, "prezzo_unitario": 18.00, "sconto_percentuale": 0, "totale": 810.00, "note_voce": "", "evidenziata": false}],
  "avvertenze": "Note importanti emerse dal sopralluogo",
  "categorie_trovate": ["Demolizioni", "Muratura"]
}

UNITÀ DI MISURA: mq, ml, mc, nr, ore, forfait, kg, cad`;

    const gptRes = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o", temperature: 0.2, response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Trascrizione sopralluogo:\n\n${trascrizione}` }],
      }),
    }, 90_000);
    if (!gptRes.ok) {
      log("error", "GPT structuring failed", { request_id: rid, fn: FN, status: gptRes.status });
      throw new Error(`GPT error: ${gptRes.status}`);
    }
    const gptData = await gptRes.json();
    const extracted = JSON.parse(gptData.choices[0].message.content);

    // 4. Process voci
    const voci = (extracted.voci || []).map((v: any, i: number) => ({
      id: crypto.randomUUID(), ordine: v.ordine || i + 1, categoria: v.categoria || "Generale",
      titolo_voce: v.titolo_voce || v.descrizione?.substring(0, 50) || "",
      descrizione: v.descrizione || "", unita_misura: v.unita_misura || v.unita || "nr",
      quantita: v.quantita || 0, prezzo_unitario: v.prezzo_unitario || 0, sconto_percentuale: v.sconto_percentuale || 0,
      totale: Number(((v.quantita || 0) * (v.prezzo_unitario || 0) * (1 - (v.sconto_percentuale || 0) / 100)).toFixed(2)),
      foto_urls: [], note_voce: v.note_voce || "", evidenziata: v.evidenziata || false,
    }));

    const subtotale = Number(voci.reduce((s: number, v: any) => s + (v.totale || 0), 0).toFixed(2));
    const ivaPerc = 22;
    const ivaImporto = Number((subtotale * (ivaPerc / 100)).toFixed(2));
    const totaleFinale = Number((subtotale + ivaImporto).toFixed(2));

    // 5. Generate numero_preventivo
    const year = new Date().getFullYear();
    let seqNum: number;
    try { const { data: seqData } = await adminClient.rpc("nextval", { seq_name: "preventivo_seq" }).single(); seqNum = seqData || Date.now() % 10000; } catch { seqNum = Date.now() % 10000; }
    const numeroPreventivo = `PV-${year}-${String(seqNum).padStart(3, "0")}`;

    const validitaGiorni = 30;
    const dataScadenza = new Date(); dataScadenza.setDate(dataScadenza.getDate() + validitaGiorni);

    // 6. Save to DB
    const { data: prev, error: insertErr } = await adminClient.from("preventivi").insert({
      company_id: companyId, cantiere_id: cantiereId || null, numero_preventivo: numeroPreventivo,
      titolo: titolo || extracted.titolo || null, cliente_nome: clienteNome, cliente_indirizzo: clienteIndirizzo,
      cliente_telefono: clienteTelefono, cliente_email: clienteEmail, cliente_piva: clientePiva,
      cliente_codice_fiscale: clienteCF, oggetto: oggetto || extracted.oggetto || "Preventivo lavori",
      luogo_lavori: extracted.luogo_lavori || null, intro_testo: extracted.intro_suggerita || null,
      note_finali: extracted.avvertenze || null, voci, subtotale, imponibile: subtotale,
      iva_percentuale: ivaPerc, iva_importo: ivaImporto, totale: totaleFinale, totale_finale: totaleFinale,
      note: extracted.avvertenze, tempi_esecuzione: extracted.tempi_esecuzione, validita_giorni: validitaGiorni,
      data_scadenza: dataScadenza.toISOString().split("T")[0], audio_url: audioPath, trascrizione,
      stato: "bozza", versione: 1, ai_elaborato: true, created_by: user.id,
    }).select().single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    log("info", "Preventivo audio processed", { request_id: rid, fn: FN, preventivo_id: prev?.id });
    return jsonOk(prev, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
