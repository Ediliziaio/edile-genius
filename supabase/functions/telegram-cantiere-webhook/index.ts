import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Rate Limiting (in-memory, resets on cold start) ──
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxPerMinute = 20): boolean {
  const key = `user:${userId}`;
  const now = Date.now();
  const limit = rateLimits.get(key);
  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (limit.count >= maxPerMinute) return false;
  limit.count++;
  return true;
}

// ── Timing-safe string comparison ──
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff ^= ab[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    // Verify Telegram secret token header (timing-safe)
    const telegramSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    if (telegramSecret) {
      const headerSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
      if (!timingSafeEqual(headerSecret, telegramSecret)) {
        console.error("Invalid Telegram webhook secret token");
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const update = await req.json();

    const url = new URL(req.url);
    const companyId = url.searchParams.get("company");
    if (!companyId) return new Response("Missing company", { status: 400, headers: corsHeaders });

    // Get bot token
    const { data: tgConfig } = await sb
      .from("telegram_config")
      .select("bot_token, bot_username")
      .eq("company_id", companyId)
      .eq("attivo", true)
      .maybeSingle();

    const botToken = tgConfig?.bot_token;
    if (!botToken) {
      console.error("No bot token configured for company", companyId);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // ── CALLBACK QUERIES (inline button clicks) ──
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = String(query.message.chat.id);
      const callbackData = query.data || "";
      const fromId = String(query.from.id);

      // Answer callback immediately (required within 3 seconds)
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: query.id }),
      });

      // Rate limit
      if (!checkRateLimit(fromId)) return new Response("ok", { status: 200, headers: corsHeaders });

      // Log
      await logMessage(sb, companyId, fromId, chatId, "callback_query", callbackData);

      const [action, ...params] = callbackData.split(":");

      switch (action) {
        case "sal_update": {
          const cantiereId = params[0];
          const percentage = parseInt(params[1]);
          if (cantiereId && !isNaN(percentage)) {
            await sb.from("cantieri").update({ stato: `avanzamento_${percentage}` } as any).eq("id", cantiereId).eq("company_id", companyId);
            await sendMessage(botToken, chatId, `✅ Avanzamento aggiornato a ${percentage}%`);
          }
          break;
        }
        case "conferma_presenza": {
          const cantiereId = params[0];
          const { data: operaio } = await sb.from("cantiere_operai").select("id, nome").eq("telegram_user_id", fromId).eq("company_id", companyId).eq("attivo", true).maybeSingle();
          if (operaio && cantiereId) {
            await sendMessage(botToken, chatId, `✅ Presenza confermata per ${operaio.nome}!`);
          }
          break;
        }
        default:
          await sendMessage(botToken, chatId, "⚠️ Azione non riconosciuta.");
      }

      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // ── MESSAGES ──
    const message = update.message || update.channel_post;
    if (!message) return new Response("ok", { status: 200, headers: corsHeaders });

    const chatId = String(message.chat.id);
    const fromUserId = String(message.from?.id || "");
    const fromUsername = message.from?.username || "";
    const messageText = message.text || "";

    // Rate limit
    if (!checkRateLimit(fromUserId)) return new Response("ok", { status: 200, headers: corsHeaders });

    // Log message
    const msgType = message.voice ? "voice" : message.photo ? "photo" : "text";
    await logMessage(sb, companyId, fromUserId, chatId, msgType, messageText.substring(0, 200));

    // Find operaio by telegram_user_id + company
    const { data: operaio } = await sb
      .from("cantiere_operai")
      .select("*, cantieri:cantiere_id(id, nome, email_report, company_id)")
      .eq("telegram_user_id", fromUserId)
      .eq("company_id", companyId)
      .eq("attivo", true)
      .maybeSingle();

    // Verify company match if operaio found
    if (operaio?.cantieri && (operaio.cantieri as any).company_id !== companyId) {
      console.error("Company mismatch for operaio", operaio.id);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Upsert session
    const { data: session } = await sb
      .from("telegram_sessions")
      .upsert({
        chat_id: chatId,
        company_id: companyId,
        cantiere_id: operaio?.cantiere_id || null,
        operaio_id: operaio?.id || null,
        ultimo_messaggio_at: new Date().toISOString(),
      }, { onConflict: "chat_id" })
      .select()
      .single();

    // ── COMMANDS ──

    if (messageText.startsWith("/")) {
      const [command] = messageText.split(" ");

      switch (command.toLowerCase()) {
        case "/start":
        case "/help":
        case "/aiuto": {
          const nome = operaio ? operaio.nome : "collega";
          await sendMessage(botToken, chatId,
            `👋 Ciao ${nome}!\n\nSono il bot per la reportistica cantiere.\n\n` +
            `🏗 <b>Comandi disponibili</b>\n\n` +
            `/cantieri — Lista i tuoi cantieri attivi\n` +
            `/report — Invia report giornaliero\n` +
            `/presenza — Conferma presenza in cantiere\n` +
            `/sal — Aggiorna avanzamento lavori\n` +
            `/status — Vedi il tuo cantiere attivo\n` +
            `/aiuto — Mostra questo messaggio\n\n` +
            `📸 Puoi anche inviare <b>foto</b> direttamente in questa chat\n` +
            `🎤 Oppure un <b>messaggio vocale</b> per il report audio` +
            (operaio?.cantieri ? `\n\n🏗️ Cantiere attivo: ${(operaio.cantieri as any).nome}` : `\n\n⚠️ Nessun cantiere assegnato. Contatta il tuo responsabile.`)
          );
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        case "/status": {
          if (operaio?.cantieri) {
            await sendMessage(botToken, chatId, `🏗️ Cantiere attivo: ${(operaio.cantieri as any).nome}\n👷 Operaio: ${operaio.nome} ${operaio.cognome || ""}\n💼 Ruolo: ${operaio.ruolo || "—"}`);
          } else {
            await sendMessage(botToken, chatId, "⚠️ Nessun cantiere assegnato. Contatta il tuo responsabile.");
          }
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        case "/cantieri": {
          const { data: cantieri } = await sb
            .from("cantiere_operai")
            .select("cantieri:cantiere_id(id, nome, stato)")
            .eq("telegram_user_id", fromUserId)
            .eq("company_id", companyId)
            .eq("attivo", true);

          if (!cantieri || cantieri.length === 0) {
            await sendMessage(botToken, chatId, "⚠️ Non sei assegnato a nessun cantiere.");
          } else {
            const list = cantieri.map((c: any, i: number) => `${i + 1}. 🏗️ ${c.cantieri?.nome || "—"} (${c.cantieri?.stato || "attivo"})`).join("\n");
            await sendMessage(botToken, chatId, `📋 <b>I tuoi cantieri:</b>\n\n${list}`);
          }
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        case "/presenza": {
          if (!operaio?.cantiere_id) {
            await sendMessage(botToken, chatId, "⚠️ Nessun cantiere assegnato.");
            return new Response("ok", { status: 200, headers: corsHeaders });
          }
          await sendMessageWithButtons(botToken, chatId,
            `📍 Confermi la presenza in cantiere?\n🏗️ ${(operaio.cantieri as any).nome}`,
            [[
              { text: "✅ Presente", callback_data: `conferma_presenza:${operaio.cantiere_id}` },
            ]]
          );
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        case "/sal": {
          if (!operaio?.cantiere_id) {
            await sendMessage(botToken, chatId, "⚠️ Nessun cantiere assegnato.");
            return new Response("ok", { status: 200, headers: corsHeaders });
          }
          await sendMessageWithButtons(botToken, chatId,
            `📊 Aggiorna avanzamento cantiere\n${(operaio.cantieri as any).nome}\n\nA che % siamo?`,
            [
              [
                { text: "10%", callback_data: `sal_update:${operaio.cantiere_id}:10` },
                { text: "25%", callback_data: `sal_update:${operaio.cantiere_id}:25` },
              ],
              [
                { text: "50%", callback_data: `sal_update:${operaio.cantiere_id}:50` },
                { text: "75%", callback_data: `sal_update:${operaio.cantiere_id}:75` },
              ],
              [
                { text: "90%", callback_data: `sal_update:${operaio.cantiere_id}:90` },
                { text: "100% ✅", callback_data: `sal_update:${operaio.cantiere_id}:100` },
              ],
            ]
          );
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        case "/report": {
          await sendMessage(botToken, chatId,
            "🎙️ Per creare il report, manda un <b>messaggio vocale</b> descrivendo:\n\n" +
            "• Chi era presente e quante ore\n• Lavori eseguiti\n• Materiali usati\n• Problemi riscontrati\n• Previsioni per domani\n\n" +
            "Puoi anche aggiungere foto 📸"
          );
          return new Response("ok", { status: 200, headers: corsHeaders });
        }

        case "/conferma": {
          // Handle report confirmation
          const sess = session as any;
          if (!sess?.pending_report_data) {
            await sendMessage(botToken, chatId, "⚠️ Nessun report in attesa. Manda prima un messaggio vocale.");
            return new Response("ok", { status: 200, headers: corsHeaders });
          }
          return await handleConfirmReport(sb, botToken, chatId, companyId, operaio, sess);
        }

        case "/annulla": {
          await sb.from("telegram_sessions").update({
            stato: "attesa",
            pending_report_data: null,
            pending_foto_urls: [],
          }).eq("chat_id", chatId);
          await sendMessage(botToken, chatId, "❌ Report annullato.");
          return new Response("ok", { status: 200, headers: corsHeaders });
        }
      }
    }

    // ── VOICE MESSAGES ──
    if (message.voice || message.audio) {
      const fileData = message.voice || message.audio;
      await sendReaction(botToken, chatId, message.message_id, "👍");
      await sendMessage(botToken, chatId, "🎙️ Audio ricevuto! Sto trascrivendo...");

      const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileData.file_id}`);
      const fileInfo = await fileInfoRes.json();
      const filePath = fileInfo.result?.file_path;

      const audioRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
      const audioBuffer = await audioRes.arrayBuffer();

      const audioFileName = `${companyId}/${chatId}/${Date.now()}.ogg`;
      await sb.storage.from("cantiere-media").upload(audioFileName, audioBuffer, { contentType: "audio/ogg", upsert: true });
      const { data: audioUrlData } = sb.storage.from("cantiere-media").getPublicUrl(audioFileName);

      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      let trascrizione = "";

      if (openaiKey) {
        const formData = new FormData();
        formData.append("file", new Blob([audioBuffer], { type: "audio/ogg" }), "audio.ogg");
        formData.append("model", "whisper-1");
        formData.append("language", "it");
        formData.append("prompt", "Trascrizione di un report di cantiere edile. Termini tecnici: intonaco, ponteggio, calcestruzzo, carpenteria, impiantistica.");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${openaiKey}` },
          body: formData,
        });
        const whisperData = await whisperRes.json();
        trascrizione = whisperData.text || "";
      }

      if (!trascrizione) {
        await sendMessage(botToken, chatId, "❌ Errore nella trascrizione. Riprova o scrivi il report come testo.");
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      const cantiereNome = (operaio?.cantieri as any)?.nome || "Cantiere";
      const reportData = await structureReport(trascrizione, cantiereNome, openaiKey!);

      await sb.from("telegram_sessions").update({
        stato: "conferma",
        pending_report_data: { ...reportData, trascrizione, audio_url: audioUrlData.publicUrl },
        pending_foto_urls: [],
      }).eq("chat_id", chatId);

      const preview = formatReportPreview(reportData);
      await sendMessage(botToken, chatId,
        `✅ Report strutturato!\n\n${preview}\n\n` +
        `Manda altre foto del cantiere (opzionale) oppure:\n` +
        `✅ /conferma — Salva e invia il report\n` +
        `✏️ Scrivi testo per aggiungere note\n` +
        `❌ /annulla — Annulla`
      );
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // ── PHOTOS ──
    if (message.photo) {
      const photo = message.photo[message.photo.length - 1];
      const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`);
      const fileInfo = await fileInfoRes.json();
      const filePath = fileInfo.result?.file_path;

      const photoRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
      const photoBuffer = await photoRes.arrayBuffer();

      const photoFileName = `${companyId}/${chatId}/${Date.now()}.jpg`;
      await sb.storage.from("cantiere-media").upload(photoFileName, photoBuffer, { contentType: "image/jpeg", upsert: true });
      const { data: photoUrlData } = sb.storage.from("cantiere-media").getPublicUrl(photoFileName);

      // Atomic photo append to session
      const currentFotos: string[] = (session as any)?.pending_foto_urls || [];
      await sb.from("telegram_sessions").update({
        pending_foto_urls: [...currentFotos, photoUrlData.publicUrl],
      }).eq("chat_id", chatId);

      await sendReaction(botToken, chatId, message.message_id, "📸");
      await sendMessage(botToken, chatId, `📸 Foto aggiunta! (${currentFotos.length + 1} totali)\nMandane altre o /conferma per salvare.`);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // ── Generic text (not a command) ──
    if (messageText && !messageText.startsWith("/")) {
      const sess = session as any;
      if (sess?.stato === "conferma" && sess?.pending_report_data) {
        // Append note to pending report
        const updated = { ...sess.pending_report_data, note_extra: (sess.pending_report_data.note_extra || "") + "\n" + messageText };
        await sb.from("telegram_sessions").update({ pending_report_data: updated }).eq("chat_id", chatId);
        await sendMessage(botToken, chatId, "📝 Nota aggiunta al report. /conferma per salvare.");
      } else {
        await sendMessage(botToken, chatId,
          "💬 Preferisci usare i messaggi vocali per i report: è più veloce!\n\n" +
          "Tieni premuto il microfono 🎙️ e racconta com'è andata la giornata."
        );
      }
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});

// ── HELPERS ──

async function sendMessage(botToken: string, chatId: string, text: string, parseMode = "HTML") {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

async function sendMessageWithButtons(
  botToken: string, chatId: string, text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>
) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    }),
  });
}

async function sendReaction(botToken: string, chatId: string, messageId: number, emoji: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/setMessageReaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reaction: [{ type: "emoji", emoji }],
      }),
    });
  } catch { /* reaction not critical */ }
}

async function logMessage(sb: any, companyId: string, userId: string, chatId: string, msgType: string, text: string) {
  try {
    await sb.from("telegram_message_log").insert({
      company_id: companyId,
      telegram_user_id: parseInt(userId) || 0,
      chat_id: parseInt(chatId) || 0,
      message_type: msgType,
      message_text: text,
      action_taken: "processed",
    });
  } catch (e) {
    console.error("Log message error:", e);
  }
}

async function handleConfirmReport(sb: any, botToken: string, chatId: string, companyId: string, operaio: any, sess: any) {
  const reportData = sess.pending_report_data;
  const fotoUrls = sess.pending_foto_urls || [];
  const cantiereNome = (operaio?.cantieri as any)?.nome || "Cantiere";
  const today = new Date().toISOString().split("T")[0];

  const { data: report, error: reportErr } = await sb.from("agent_reports").insert({
    company_id: companyId,
    cantiere_id: operaio?.cantiere_id || null,
    operaio_id: operaio?.id || null,
    date: today,
    telegram_chat_id: chatId,
    audio_url: reportData.audio_url || null,
    trascrizione: reportData.trascrizione || null,
    foto_urls: fotoUrls,
    operai_presenti: reportData.operai_presenti || [],
    lavori_eseguiti: reportData.lavori_eseguiti || [],
    materiali_usati: reportData.materiali_usati || [],
    materiali_da_ordinare: reportData.materiali_da_ordinare || [],
    problemi: reportData.problemi || [],
    avanzamento_percentuale: reportData.avanzamento_percentuale || null,
    previsione_domani: reportData.previsione_domani || null,
    condizioni_meteo: reportData.condizioni_meteo || null,
    fonte: "telegram",
    status: "sent",
    raw_data: reportData,
    report_html: generateReportHTML(reportData, cantiereNome, operaio?.nome || "", fotoUrls, today),
    report_summary: generateReportSummary(reportData, cantiereNome, operaio?.nome || "", today),
    instance_id: "00000000-0000-0000-0000-000000000000",
  } as any).select().single();

  if (reportErr) {
    await sendMessage(botToken, chatId, "❌ Errore nel salvataggio. Riprova.");
    console.error(reportErr);
    return new Response("ok", { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  // Send email
  const emailDestinatari = (operaio?.cantieri as any)?.email_report || [];
  if (emailDestinatari.length > 0 && report) {
    try {
      await sb.functions.invoke("send-cantiere-report-email", {
        body: { report_id: report.id, destinatari: emailDestinatari, company_id: companyId },
      });
      await sb.from("agent_reports").update({ email_inviata: true, email_inviata_at: new Date().toISOString() } as any).eq("id", report.id);
    } catch (e) { console.error("Email send error:", e); }
  }

  // Reset session
  await sb.from("telegram_sessions").update({
    stato: "attesa",
    pending_report_data: null,
    pending_foto_urls: [],
  }).eq("chat_id", chatId);

  await sendMessage(botToken, chatId,
    `🎉 Report salvato con successo!\n\n📅 ${today}\n🏗️ ${cantiereNome}\n` +
    (fotoUrls.length > 0 ? `📸 ${fotoUrls.length} foto allegate\n` : "") +
    (emailDestinatari.length > 0 ? `📧 Email inviata a ${emailDestinatari.join(", ")}\n` : "") +
    `\n📊 Vedi il report nella dashboard`
  );
  return new Response("ok", { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
}

async function structureReport(trascrizione: string, cantiere: string, openaiKey: string) {
  const prompt = `Sei un assistente per la reportistica di cantieri edili italiani.
Analizza questa trascrizione di un messaggio vocale di un operaio e struttura le informazioni.

TRASCRIZIONE: "${trascrizione}"

Rispondi SOLO con JSON valido:
{
  "operai_presenti": [{"nome": "string", "ruolo": "string", "ore": number}],
  "lavori_eseguiti": ["descrizione lavoro 1"],
  "materiali_usati": ["materiale 1 con quantità"],
  "materiali_da_ordinare": ["materiale da ordinare"],
  "problemi": ["problema 1"],
  "avanzamento_percentuale": number_or_null,
  "previsione_domani": "descrizione lavori previsti domani",
  "condizioni_meteo": "soleggiato|nuvoloso|pioggia|vento|neve",
  "note_extra": "altre note importanti"
}

Se non viene menzionato un campo, metti array vuoto [] o null.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { lavori_eseguiti: [trascrizione], operai_presenti: [], materiali_usati: [], problemi: [] };
  }
}

function formatReportPreview(data: any): string {
  const lines = [];
  if (data.operai_presenti?.length) {
    lines.push(`👷 Operai (${data.operai_presenti.length}): ${data.operai_presenti.map((o: any) => `${o.nome}${o.ore ? " " + o.ore + "h" : ""}`).join(", ")}`);
  }
  if (data.lavori_eseguiti?.length) {
    lines.push(`🔨 Lavori:\n${data.lavori_eseguiti.map((l: string) => `  • ${l}`).join("\n")}`);
  }
  if (data.materiali_usati?.length) {
    lines.push(`📦 Materiali:\n${data.materiali_usati.map((m: string) => `  • ${m}`).join("\n")}`);
  }
  if (data.problemi?.length) {
    lines.push(`⚠️ Problemi:\n${data.problemi.map((p: string) => `  • ${p}`).join("\n")}`);
  }
  if (data.avanzamento_percentuale) {
    lines.push(`📊 Avanzamento: ${data.avanzamento_percentuale}%`);
  }
  return lines.join("\n\n");
}

function generateReportHTML(data: any, cantiere: string, operaio: string, fotos: string[], date: string): string {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border-top:4px solid #10b981;padding:24px;">
    <h1 style="font-size:20px;">📋 Report Giornaliero</h1>
    <p style="color:#666;font-size:14px;">🏗️ ${cantiere} · 📅 ${date} · 👷 ${operaio}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
    ${data.operai_presenti?.length ? `<p><strong>👷 Operai (${data.operai_presenti.length}):</strong> ${data.operai_presenti.map((o: any) => `${o.nome} ${o.ore ? o.ore + "h" : ""}`).join(", ")}</p>` : ""}
    ${data.lavori_eseguiti?.length ? `<p><strong>🔨 Lavori:</strong></p><ul>${data.lavori_eseguiti.map((l: string) => `<li>${l}</li>`).join("")}</ul>` : ""}
    ${data.materiali_usati?.length ? `<p><strong>📦 Materiali:</strong></p><ul>${data.materiali_usati.map((m: string) => `<li>${m}</li>`).join("")}</ul>` : ""}
    ${data.materiali_da_ordinare?.length ? `<p><strong>🛒 Da ordinare:</strong></p><ul>${data.materiali_da_ordinare.map((m: string) => `<li>${m}</li>`).join("")}</ul>` : ""}
    ${data.problemi?.length ? `<p><strong>⚠️ Problemi:</strong></p><ul>${data.problemi.map((p: string) => `<li>${p}</li>`).join("")}</ul>` : ""}
    ${data.avanzamento_percentuale ? `<p><strong>📊 Avanzamento:</strong> ${data.avanzamento_percentuale}%</p>` : ""}
    ${data.previsione_domani ? `<p><strong>📅 Domani:</strong> ${data.previsione_domani}</p>` : ""}
    ${fotos.length > 0 ? `<hr><p><strong>📸 Foto (${fotos.length}):</strong></p>${fotos.map(f => `<img src="${f}" style="max-width:100%;margin:8px 0;border-radius:8px;">`).join("")}` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
    <p style="font-size:12px;color:#999;">Report generato via Telegram · edilizia.io</p>
  </div>`;
}

function generateReportSummary(data: any, cantiere: string, operaio: string, date: string): string {
  const parts = [`📋 ${cantiere} — ${date} — ${operaio}`];
  if (data.operai_presenti?.length) parts.push(`👷 ${data.operai_presenti.length} operai`);
  if (data.avanzamento_percentuale) parts.push(`📊 ${data.avanzamento_percentuale}%`);
  if (data.problemi?.length) parts.push(`⚠️ ${data.problemi.length} problemi`);
  else parts.push("✅ Nessun problema");
  return parts.join(" · ");
}
