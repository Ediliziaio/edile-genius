import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Constants ---
const VALID_DOC_TYPES = ["url", "text", "file"];
const MAX_NAME_LENGTH = 255;
const MAX_CONTENT_PREVIEW_LENGTH = 50000;
const MAX_BODY_SIZE = 1_000_000; // 1 MB

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ── 1. Authentication ──────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const elApiKey = Deno.env.get("ELEVENLABS_API_KEY");

    // Validate JWT
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── 2. Get user's company & roles ─────────────────────────────
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("company_id").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const userCompanyId = profileRes.data?.company_id as string | null;
    const roles = (rolesRes.data || []).map((r: { role: string }) => r.role);
    const isSuperadmin = roles.includes("superadmin") || roles.includes("superadmin_user");

    // ── 3. Parse & validate body ──────────────────────────────────
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return json({ error: "Payload too large" }, 413);
    }

    const body = await req.json();
    const {
      company_id,
      agent_id,
      name,
      type,
      source_url,
      content_preview,
      file_path,
      doc_id,
    } = body;

    // ── 4. Tenant authorization ───────────────────────────────────
    const targetCompanyId = company_id || userCompanyId;
    if (!targetCompanyId) {
      return json({ error: "company_id required" }, 400);
    }
    if (!isSuperadmin && targetCompanyId !== userCompanyId) {
      return json({ error: "Forbidden: cross-tenant access denied" }, 403);
    }

    // ── 5. Input validation ───────────────────────────────────────
    if (name && (typeof name !== "string" || name.length > MAX_NAME_LENGTH)) {
      return json({ error: `name must be a string of max ${MAX_NAME_LENGTH} chars` }, 400);
    }
    if (type && !VALID_DOC_TYPES.includes(type)) {
      return json({ error: `type must be one of: ${VALID_DOC_TYPES.join(", ")}` }, 400);
    }
    if (source_url && !isValidHttpUrl(source_url)) {
      return json({ error: "source_url must be a valid HTTP(S) URL" }, 400);
    }
    if (content_preview && (typeof content_preview !== "string" || content_preview.length > MAX_CONTENT_PREVIEW_LENGTH)) {
      return json({ error: `content_preview must be max ${MAX_CONTENT_PREVIEW_LENGTH} chars` }, 400);
    }

    // Validate file_path belongs to this company's folder
    if (file_path) {
      if (typeof file_path !== "string" || !file_path.startsWith(`${targetCompanyId}/`)) {
        return json({ error: "Forbidden: file_path must belong to your company" }, 403);
      }
    }

    // Validate agent_id belongs to the same company
    if (agent_id) {
      const { data: agentCheck, error: agentErr } = await supabase
        .from("agents")
        .select("company_id")
        .eq("id", agent_id)
        .single();
      if (agentErr || !agentCheck) {
        return json({ error: "Agent not found" }, 404);
      }
      if (agentCheck.company_id !== targetCompanyId) {
        return json({ error: "Forbidden: agent belongs to a different company" }, 403);
      }
    }

    // ── Helper: sync to EL knowledge base ─────────────────────────
    const syncToEL = async (elAgentId: string, docId: string, elBody: Record<string, unknown>) => {
      if (!elApiKey) return;
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${elAgentId}/add-to-knowledge-base`,
          { method: "POST", headers: { "xi-api-key": elApiKey, "Content-Type": "application/json" }, body: JSON.stringify(elBody) }
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

    // ── 6. File upload flow (existing doc) ────────────────────────
    if (doc_id && type === "file" && file_path) {
      // Verify doc belongs to this company
      const { data: docCheck } = await supabase
        .from("ai_knowledge_docs")
        .select("company_id")
        .eq("id", doc_id)
        .single();
      if (!docCheck || docCheck.company_id !== targetCompanyId) {
        return json({ error: "Forbidden: document belongs to a different company" }, 403);
      }

      try {
        const { data: fileData, error: downloadErr } = await supabase.storage.from("knowledge-docs").download(file_path);
        if (downloadErr || !fileData) {
          await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc_id);
          return json({ error: "Failed to download file" }, 500);
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
                if (extractedText.length > 20) {
                  await syncToEL(agent.el_agent_id, doc_id, { text: extractedText.slice(0, 10000), name: name || file_path });
                }
              }
            } catch {
              if (extractedText.length > 20) {
                const { data: ag } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
                if (ag?.el_agent_id) {
                  await syncToEL(ag.el_agent_id, doc_id, { text: extractedText.slice(0, 10000), name: name || file_path });
                }
              }
            }
          }
        }

        return json({ success: true, doc_id });
      } catch (procErr) {
        await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc_id);
        return json({ error: "Processing failed" }, 500);
      }
    }

    // ── 7. Create new doc record ──────────────────────────────────
    if (!name || !type) {
      return json({ error: "name and type are required" }, 400);
    }

    const { data: doc, error: insertErr } = await supabase.from("ai_knowledge_docs").insert({
      company_id: targetCompanyId,
      agent_id: agent_id || null,
      name,
      type,
      source_url: source_url || null,
      content_preview: content_preview || null,
      file_path: file_path || null,
      status: "processing",
      el_sync_status: "pending",
      created_by: userId,
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
      // Global doc — sync to all active agents of this company
      if (!agent_id && elApiKey) {
        const { data: companyAgents } = await supabase.from("agents")
          .select("id, el_agent_id").eq("company_id", targetCompanyId).eq("status", "active").not("el_agent_id", "is", null);

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

    return json({ success: true, doc_id: doc.id });
  } catch (err) {
    console.error("add-knowledge-doc error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
