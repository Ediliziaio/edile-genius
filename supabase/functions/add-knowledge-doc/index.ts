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
    const elApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { company_id, agent_id, name, type, source_url, content_preview, file_path, doc_id } = await req.json();

    // If doc_id is provided, process an existing record (file upload flow)
    if (doc_id && type === "file" && file_path) {
      try {
        // Download file from storage
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from("knowledge-docs")
          .download(file_path);

        if (downloadErr || !fileData) {
          console.error("Download error:", downloadErr);
          await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc_id);
          return new Response(JSON.stringify({ error: "Failed to download file" }), { status: 500, headers: corsHeaders });
        }

        // Extract text based on file extension
        const ext = (file_path.split(".").pop() || "").toLowerCase();
        let extractedText = "";

        if (ext === "txt" || ext === "csv") {
          const bytes = await fileData.arrayBuffer();
          extractedText = new TextDecoder("utf-8").decode(bytes);
        } else if (ext === "pdf") {
          // Basic PDF text extraction: try UTF-8 decode, extract readable strings
          const bytes = new Uint8Array(await fileData.arrayBuffer());
          const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
          // Extract text between BT/ET blocks or parentheses (basic)
          const textMatches = rawText.match(/\(([^)]+)\)/g);
          if (textMatches && textMatches.length > 5) {
            extractedText = textMatches
              .map((m) => m.slice(1, -1))
              .filter((t) => t.length > 2 && /[a-zA-ZÀ-ú]/.test(t))
              .join(" ");
          }
          if (!extractedText || extractedText.length < 20) {
            extractedText = `[PDF] ${name || file_path} — Contenuto binario. Per una migliore indicizzazione, converti il PDF in formato testo.`;
          }
        } else {
          extractedText = `[File] ${name || file_path}`;
        }

        const preview = extractedText.slice(0, 500);

        await supabase.from("ai_knowledge_docs").update({
          content_preview: preview,
          status: "ready",
        }).eq("id", doc_id);

        // If agent_id present, try EL sync
        if (agent_id && elApiKey) {
          try {
            const { data: agent } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
            if (agent?.el_agent_id && extractedText.length > 20) {
              const elRes = await fetch(
                `https://api.elevenlabs.io/v1/convai/agents/${agent.el_agent_id}/add-to-knowledge-base`,
                {
                  method: "POST",
                  headers: { "xi-api-key": elApiKey, "Content-Type": "application/json" },
                  body: JSON.stringify({ text: extractedText.slice(0, 10000), name: name || file_path }),
                }
              );
              if (elRes.ok) {
                const elData = await elRes.json();
                await supabase.from("ai_knowledge_docs").update({
                  el_doc_id: elData.id || elData.doc_id || null,
                }).eq("id", doc_id);
              }
            }
          } catch (elErr) {
            console.error("EL sync error:", elErr);
          }
        }

        return new Response(JSON.stringify({ success: true, doc_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (procErr) {
        console.error("File processing error:", procErr);
        await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc_id);
        return new Response(JSON.stringify({ error: procErr.message }), { status: 500, headers: corsHeaders });
      }
    }

    // Original flow: create new doc record
    if (!company_id || !name || !type) {
      return new Response(JSON.stringify({ error: "company_id, name, type required" }), { status: 400, headers: corsHeaders });
    }

    const { data: doc, error: insertErr } = await supabase.from("ai_knowledge_docs").insert({
      company_id,
      agent_id: agent_id || null,
      name,
      type,
      source_url: source_url || null,
      content_preview: content_preview || null,
      file_path: file_path || null,
      status: "processing",
    }).select().single();

    if (insertErr) throw insertErr;

    // If agent has ElevenLabs ID, sync doc to EL knowledge base
    if (agent_id && elApiKey) {
      try {
        const { data: agent } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
        if (agent?.el_agent_id) {
          let elBody: Record<string, unknown> = {};

          if (type === "url" && source_url) {
            elBody = { url: source_url, name };
          } else if (type === "text" && content_preview) {
            elBody = { text: content_preview, name };
          }

          if (Object.keys(elBody).length > 0) {
            const elRes = await fetch(
              `https://api.elevenlabs.io/v1/convai/agents/${agent.el_agent_id}/add-to-knowledge-base`,
              {
                method: "POST",
                headers: { "xi-api-key": elApiKey, "Content-Type": "application/json" },
                body: JSON.stringify(elBody),
              }
            );

            if (elRes.ok) {
              const elData = await elRes.json();
              await supabase.from("ai_knowledge_docs").update({
                el_doc_id: elData.id || elData.doc_id || null,
                status: "ready",
              }).eq("id", doc.id);
            } else {
              const errText = await elRes.text();
              console.error("EL sync failed:", errText);
              await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
            }
          } else {
            await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
          }
        } else {
          await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
        }
      } catch (elErr) {
        console.error("EL knowledge sync error:", elErr);
        await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc.id);
      }
    } else {
      await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
    }

    return new Response(JSON.stringify({ success: true, doc_id: doc.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("add-knowledge-doc error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
