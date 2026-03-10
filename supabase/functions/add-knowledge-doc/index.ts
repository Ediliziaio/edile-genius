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

    // Helper: sync to EL knowledge base
    const syncToEL = async (elAgentId: string, docId: string, body: Record<string, unknown>) => {
      if (!elApiKey) return;
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${elAgentId}/add-to-knowledge-base`,
          { method: "POST", headers: { "xi-api-key": elApiKey, "Content-Type": "application/json" }, body: JSON.stringify(body) }
        );
        if (elRes.ok) {
          const elData = await elRes.json();
          await supabase.from("ai_knowledge_docs").update({
            el_doc_id: elData.id || elData.doc_id || null,
            el_sync_status: "synced",
            el_sync_at: new Date().toISOString(),
            status: "ready",
          }).eq("id", docId);
        } else {
          await supabase.from("ai_knowledge_docs").update({ status: "ready", el_sync_status: "error" }).eq("id", docId);
        }
      } catch (e) {
        console.error("EL sync error:", e);
        await supabase.from("ai_knowledge_docs").update({ el_sync_status: "error" }).eq("id", docId);
      }
    };

    // File upload flow (existing doc)
    if (doc_id && type === "file" && file_path) {
      try {
        const { data: fileData, error: downloadErr } = await supabase.storage.from("knowledge-docs").download(file_path);
        if (downloadErr || !fileData) {
          await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc_id);
          return new Response(JSON.stringify({ error: "Failed to download file" }), { status: 500, headers: corsHeaders });
        }

        const ext = (file_path.split(".").pop() || "").toLowerCase();
        let extractedText = "";

        if (ext === "txt" || ext === "csv") {
          extractedText = new TextDecoder("utf-8").decode(await fileData.arrayBuffer());
        } else if (ext === "pdf") {
          const rawText = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(await fileData.arrayBuffer()));
          const textMatches = rawText.match(/\(([^)]+)\)/g);
          if (textMatches && textMatches.length > 5) {
            extractedText = textMatches.map(m => m.slice(1, -1)).filter(t => t.length > 2 && /[a-zA-ZÀ-ú]/.test(t)).join(" ");
          }
          if (!extractedText || extractedText.length < 20) {
            extractedText = `[PDF] ${name || file_path} — Contenuto binario.`;
          }
        } else {
          extractedText = `[File] ${name || file_path}`;
        }

        await supabase.from("ai_knowledge_docs").update({ content_preview: extractedText.slice(0, 500), status: "ready" }).eq("id", doc_id);

        // Sync to EL via file upload (multipart)
        if (agent_id && elApiKey) {
          const { data: agent } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
          if (agent?.el_agent_id) {
            // Try multipart file upload first
            try {
              const formData = new FormData();
              formData.append("file", fileData, name || "document");
              const elRes = await fetch(
                `https://api.elevenlabs.io/v1/convai/agents/${agent.el_agent_id}/add-to-knowledge-base`,
                { method: "POST", headers: { "xi-api-key": elApiKey }, body: formData }
              );
              if (elRes.ok) {
                const elData = await elRes.json();
                await supabase.from("ai_knowledge_docs").update({
                  el_doc_id: elData.id || null, el_sync_status: "synced", el_sync_at: new Date().toISOString(),
                }).eq("id", doc_id);
              } else {
                // Fallback to text
                if (extractedText.length > 20) {
                  await syncToEL(agent.el_agent_id, doc_id, { text: extractedText.slice(0, 10000), name: name || file_path });
                }
              }
            } catch {
              if (extractedText.length > 20) {
                await syncToEL(agent.el_agent_id, doc_id, { text: extractedText.slice(0, 10000), name: name || file_path });
              }
            }
          }
        }

        return new Response(JSON.stringify({ success: true, doc_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (procErr) {
        await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc_id);
        return new Response(JSON.stringify({ error: (procErr as Error).message }), { status: 500, headers: corsHeaders });
      }
    }

    // Create new doc record
    if (!company_id || !name || !type) {
      return new Response(JSON.stringify({ error: "company_id, name, type required" }), { status: 400, headers: corsHeaders });
    }

    const { data: doc, error: insertErr } = await supabase.from("ai_knowledge_docs").insert({
      company_id, agent_id: agent_id || null, name, type,
      source_url: source_url || null, content_preview: content_preview || null,
      file_path: file_path || null, status: "processing", el_sync_status: "pending",
    }).select().single();

    if (insertErr) throw insertErr;

    if (agent_id && elApiKey) {
      const { data: agent } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
      if (agent?.el_agent_id) {
        let elBody: Record<string, unknown> = {};
        if (type === "url" && source_url) elBody = { url: source_url, name };
        else if (type === "text" && content_preview) elBody = { text: content_preview, name };

        if (Object.keys(elBody).length > 0) {
          await syncToEL(agent.el_agent_id, doc.id, elBody);
        } else {
          await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
        }
      } else {
        await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
      }
    } else {
      // Global doc — sync to all active agents
      if (!agent_id && company_id && elApiKey) {
        const { data: companyAgents } = await supabase.from("agents")
          .select("id, el_agent_id").eq("company_id", company_id).eq("status", "active").not("el_agent_id", "is", null);

        if (companyAgents?.length) {
          for (const ag of companyAgents) {
            if (!ag.el_agent_id) continue;
            let elBody: Record<string, unknown> = {};
            if (type === "url" && source_url) elBody = { url: source_url, name };
            else if (type === "text" && content_preview) elBody = { text: content_preview, name };
            if (Object.keys(elBody).length > 0) {
              try {
                await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ag.el_agent_id}/add-to-knowledge-base`, {
                  method: "POST", headers: { "xi-api-key": elApiKey, "Content-Type": "application/json" }, body: JSON.stringify(elBody),
                });
              } catch (e) { console.error("Global doc sync error for agent", ag.id, e); }
            }
          }
        }
        await supabase.from("ai_knowledge_docs").update({ status: "ready", el_sync_status: "synced", el_sync_at: new Date().toISOString() }).eq("id", doc.id);
      } else {
        await supabase.from("ai_knowledge_docs").update({ status: "ready" }).eq("id", doc.id);
      }
    }

    return new Response(JSON.stringify({ success: true, doc_id: doc.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("add-knowledge-doc error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
