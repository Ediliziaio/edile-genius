import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Constants ---
const VALID_DOC_TYPES = ["url", "text", "file", "scrape"];
const MAX_NAME_LENGTH = 255;
const MAX_CONTENT_PREVIEW_LENGTH = 50000;
const MAX_BODY_SIZE = 1_000_000; // 1 MB

// --- SSRF Protection ---
const BLOCKED_HOSTNAMES = ["localhost", "metadata.google.internal", "metadata.google", "metadata"];

function isSafeUrl(urlStr: string): { safe: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { safe: false, reason: "URL non valido" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "Solo HTTP/HTTPS consentiti" };
  }
  const hostname = parsed.hostname.toLowerCase();

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { safe: false, reason: "Hostname bloccato" };
  }
  // Block IPv6 loopback
  if (hostname === "[::1]" || hostname === "::1") {
    return { safe: false, reason: "Indirizzo loopback bloccato" };
  }

  // Check IP-based hostnames
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 127) return { safe: false, reason: "Indirizzo loopback bloccato" };
    if (a === 10) return { safe: false, reason: "IP privato bloccato" };
    if (a === 172 && b >= 16 && b <= 31) return { safe: false, reason: "IP privato bloccato" };
    if (a === 192 && b === 168) return { safe: false, reason: "IP privato bloccato" };
    if (a === 169 && b === 254) return { safe: false, reason: "Link-local bloccato" };
    if (a === 0) return { safe: false, reason: "IP riservato bloccato" };
  }

  return { safe: true };
}

// --- File content extraction ---
function extractTextFromPdf(bytes: Uint8Array): string {
  // Improved PDF text extraction targeting TJ, Tj, ', " operators
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const textParts: string[] = [];

  // Match text within parentheses for Tj operator: (text) Tj
  const tjMatches = raw.matchAll(/\(([^)]{2,})\)\s*T[jJ]/g);
  for (const m of tjMatches) {
    const t = m[1].replace(/\\[nrt]/g, " ").trim();
    if (t.length > 1 && /[a-zA-ZÀ-ú0-9]/.test(t)) textParts.push(t);
  }

  // Match TJ arrays: [(text1) 123 (text2)] TJ
  const tjArrayMatches = raw.matchAll(/\[([^\]]{3,})\]\s*TJ/gi);
  for (const m of tjArrayMatches) {
    const inner = m[1];
    const parts = inner.matchAll(/\(([^)]+)\)/g);
    for (const p of parts) {
      const t = p[1].replace(/\\[nrt]/g, " ").trim();
      if (t.length > 1 && /[a-zA-ZÀ-ú0-9]/.test(t)) textParts.push(t);
    }
  }

  // Fallback: broader parentheses extraction
  if (textParts.length < 5) {
    const fallback = raw.matchAll(/\(([^)]{3,})\)/g);
    for (const m of fallback) {
      const t = m[1].trim();
      if (t.length > 2 && /[a-zA-ZÀ-ú]{2,}/.test(t) && !/^[\d\s.]+$/.test(t)) {
        textParts.push(t);
      }
    }
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

function extractTextFromDocx(bytes: Uint8Array): string {
  // DOCX files are ZIP archives — find word/document.xml by locating PK headers
  // Simple approach: search for <w:t> tags in the raw bytes
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

  // Find the document.xml content between PK entries
  const xmlStart = raw.indexOf("<?xml");
  if (xmlStart === -1) return "";

  const textParts: string[] = [];
  // Extract all <w:t ...>content</w:t> tags
  const wtMatches = raw.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  for (const m of wtMatches) {
    const t = m[1].trim();
    if (t.length > 0) textParts.push(t);
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
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
      size_bytes,
      scraped_content,
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

    // SSRF validation for URLs
    if (source_url) {
      const urlCheck = isSafeUrl(source_url);
      if (!urlCheck.safe) {
        return json({ error: `URL non consentito: ${urlCheck.reason}` }, 400);
      }
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

    // ── Helper: extract text from a file in storage ───────────────
    const extractFileContent = async (path: string, fileName: string): Promise<string> => {
      const { data: fileData, error: downloadErr } = await supabase.storage.from("knowledge-docs").download(path);
      if (downloadErr || !fileData) throw new Error("Failed to download file");

      const ext = (path.split(".").pop() || "").toLowerCase();
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      if (ext === "txt" || ext === "csv" || ext === "md") {
        return new TextDecoder("utf-8").decode(bytes);
      }
      if (ext === "json") {
        const raw = new TextDecoder("utf-8").decode(bytes);
        try {
          return JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
          return raw;
        }
      }
      if (ext === "pdf") {
        const text = extractTextFromPdf(bytes);
        if (text.length >= 20) return text;
        return `[PDF] ${fileName} — Contenuto non estraibile (possibile PDF scansionato).`;
      }
      if (ext === "docx" || ext === "doc") {
        const text = extractTextFromDocx(bytes);
        if (text.length >= 10) return text;
        return `[DOCX] ${fileName} — Contenuto non estraibile.`;
      }

      return `[File] ${fileName}`;
    };

    // ── 6. File upload flow (existing doc via doc_id) ─────────────
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
        const extractedText = await extractFileContent(file_path, name || file_path);

        await supabase.from("ai_knowledge_docs").update({
          content_preview: extractedText.slice(0, 500),
          status: "ready",
        }).eq("id", doc_id);

        // Sync to EL
        if (agent_id && elApiKey) {
          const { data: agent } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
          if (agent?.el_agent_id && extractedText.length > 20) {
            await syncToEL(agent.el_agent_id, doc_id, { text: extractedText.slice(0, 10000), name: name || file_path });
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

    const insertPayload: Record<string, unknown> = {
      company_id: targetCompanyId,
      agent_id: agent_id || null,
      name,
      type,
      source_url: source_url || null,
      content_preview: content_preview?.slice(0, 500) || null,
      file_path: file_path || null,
      size_bytes: size_bytes || null,
      status: "processing",
      el_sync_status: "pending",
      created_by: userId,
    };

    const { data: doc, error: insertErr } = await supabase
      .from("ai_knowledge_docs")
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr) throw insertErr;

    // ── 8. Process by type ────────────────────────────────────────

    // --- FILE: extract content and sync ---
    if (type === "file" && file_path) {
      try {
        const extractedText = await extractFileContent(file_path, name);

        await supabase.from("ai_knowledge_docs").update({
          content_preview: extractedText.slice(0, 500),
          status: "ready",
        }).eq("id", doc.id);

        if (agent_id && elApiKey) {
          const { data: agent } = await supabase.from("agents").select("el_agent_id").eq("id", agent_id).single();
          if (agent?.el_agent_id && extractedText.length > 20) {
            await syncToEL(agent.el_agent_id, doc.id, { text: extractedText.slice(0, 10000), name });
          }
        }
      } catch {
        await supabase.from("ai_knowledge_docs").update({ status: "error" }).eq("id", doc.id);
      }
      return json({ success: true, doc_id: doc.id });
    }

    // --- URL or TEXT: sync to EL ---
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
    } else if (!agent_id && elApiKey) {
      // Global doc — sync to all active agents of this company
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

    return json({ success: true, doc_id: doc.id });
  } catch (err) {
    console.error("add-knowledge-doc error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
