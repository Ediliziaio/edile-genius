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

    const { company_id, agent_id, name, type, source_url, content_preview, file_path } = await req.json();

    if (!company_id || !name || !type) {
      return new Response(JSON.stringify({ error: "company_id, name, type required" }), { status: 400, headers: corsHeaders });
    }

    // Insert doc record
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
          let elBody: Record<string, unknown>;

          if (type === "url" && source_url) {
            elBody = { url: source_url, name };
          } else if (type === "text" && content_preview) {
            elBody = { text: content_preview, name };
          } else {
            // For file type, we skip EL sync (would need file upload)
            elBody = {};
          }

          if (Object.keys(elBody).length > 0) {
            const elRes = await fetch(
              `https://api.elevenlabs.io/v1/convai/agents/${agent.el_agent_id}/add-to-knowledge-base`,
              {
                method: "POST",
                headers: {
                  "xi-api-key": elApiKey,
                  "Content-Type": "application/json",
                },
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
