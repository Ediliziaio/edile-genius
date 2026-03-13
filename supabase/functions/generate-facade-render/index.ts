import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "generate-facade-render";

  let sessionId: string | undefined;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    sessionId = body.session_id;
    const userPrompt = body.user_prompt;
    const systemPrompt = body.system_prompt;
    const negativePrompt = body.negative_prompt;
    const promptVersion = body.prompt_version || "1.0.0";

    if (!sessionId) return jsonError("session_id required", "validation_error", 400, rid);
    if (!userPrompt) return jsonError("user_prompt required", "validation_error", 400, rid);

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("render_facciata_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (sessErr || !session) return jsonError("Session not found", "not_found", 404, rid);

    // Verify user belongs to same company (superadmins bypass)
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isSuperAdmin = userRoles?.some((r: { role: string }) => r.role === "superadmin" || r.role === "superadmin_user");
    if (!isSuperAdmin && (!profile || profile.company_id !== session.company_id)) {
      return jsonError("Access denied", "auth_error", 403, rid);
    }

    // Generate signed URL for original photo
    const originalPath = session.original_path;
    if (!originalPath) return jsonError("No original photo in session", "validation_error", 400, rid);

    const { data: signedData, error: signedErr } = await supabase.storage
      .from("facciata-originals")
      .createSignedUrl(originalPath, 3600);
    if (signedErr || !signedData?.signedUrl) throw new Error("Failed to create signed URL");
    const imageUrl = signedData.signedUrl;

    // Check credits
    const { data: credits } = await supabase
      .from("render_credits")
      .select("balance")
      .eq("company_id", session.company_id)
      .single();
    if (!credits || credits.balance <= 0) {
      await supabase.from("render_facciata_sessions")
        .update({ status: "error", error_message: "Crediti render esauriti" })
        .eq("id", sessionId);
      return jsonError("No render credits", "insufficient_credits", 402, rid);
    }

    // Mark rendering
    await supabase.from("render_facciata_sessions")
      .update({ status: "rendering" })
      .eq("id", sessionId);

    // Get provider config
    const { data: providerConfig } = await supabase
      .from("render_provider_config")
      .select("*")
      .eq("is_default", true)
      .eq("is_active", true)
      .single();
    if (!providerConfig) throw new Error("No active provider configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const startMs = Date.now();

    // Build message parts
    const messageParts: any[] = [
      { type: "text", text: userPrompt },
      { type: "image_url", image_url: { url: imageUrl } },
    ];
    if (negativePrompt) {
      messageParts.push({ type: "text", text: `NEGATIVE (never render): ${negativePrompt}` });
    }

    // Call AI
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          { role: "system", content: systemPrompt || "You are an expert architectural renderer specializing in Italian building facades." },
          {
            role: "user",
            content: messageParts,
          },
        ],
        modalities: ["image", "text"],
        temperature: 1,
        max_tokens: 16384,
      }),
    }, 120_000);

    if (!response.ok) {
      const errText = await response.text();
      log("error", "AI Gateway error", { request_id: rid, fn: FN, status: response.status });
      throw new Error(`AI Gateway error: ${response.status} ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const generationMs = Date.now() - startMs;

    // Extract image — check multiple response formats
    let imageData: string | undefined;
    const imagesField = data.choices?.[0]?.message?.images;
    const contentField = data.choices?.[0]?.message?.content;

    if (Array.isArray(imagesField) && imagesField.length > 0) {
      imageData = imagesField[0]?.image_url?.url;
    } else if (typeof contentField === "string" && contentField.startsWith("data:image")) {
      imageData = contentField;
    } else if (Array.isArray(contentField)) {
      const imgPart = contentField.find((p: any) => p.type === "image_url" || p.inlineData);
      if (imgPart?.image_url?.url) {
        imageData = imgPart.image_url.url;
      } else if (imgPart?.inlineData?.data) {
        imageData = `data:image/png;base64,${imgPart.inlineData.data}`;
      }
    }
    if (!imageData) throw new Error("No image returned from AI");

    // Upload result
    const base64 = imageData.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const resultPath = `${session.company_id}/${sessionId}_result.png`;
    const { error: uploadErr } = await supabase.storage
      .from("facciata-results")
      .upload(resultPath, bytes, { contentType: "image/png", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("facciata-results").getPublicUrl(resultPath);
    const resultUrl = urlData.publicUrl;

    // Deduct credit AFTER success
    await supabase.rpc("deduct_render_credit", { _company_id: session.company_id });

    // Update session
    await supabase.from("render_facciata_sessions").update({
      status: "completed",
      render_path: resultPath,
      render_url: resultUrl,
      prompt_used: userPrompt.substring(0, 10000),
      prompt_version: promptVersion,
      generation_ms: generationMs,
      credits_used: 1,
    }).eq("id", sessionId);

    // Audit log
    await supabase.from("render_provider_config")
      .update({ renders_generated: (providerConfig.renders_generated || 0) + 1 })
      .eq("id", providerConfig.id);
    await supabase.from("ai_audit_log").insert({
      action: "facade_render_generated",
      company_id: session.company_id,
      user_id: session.user_id,
      entity_type: "render_facciata_session",
      entity_id: sessionId,
      details: {
        provider: providerConfig.provider_key,
        cost_billed: providerConfig.cost_billed_per_render,
        prompt_version: promptVersion,
        generation_ms: generationMs,
      },
    });

    log("info", "Facade render completed", { request_id: rid, fn: FN, session_id: sessionId, generation_ms: generationMs });
    return jsonOk({ success: true, result_url: resultUrl, generation_ms: generationMs }, rid);
  } catch (err) {
    log("error", "Facade render failed", {
      request_id: rid, fn: FN, session_id: sessionId,
      error: err instanceof Error ? err.message : "unknown",
    });

    try {
      if (sessionId) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("render_facciata_sessions").update({
          status: "error",
          error_message: err instanceof Error ? err.message : "Unknown error",
        }).eq("id", sessionId);
      }
    } catch { /* best effort */ }

    return errorResponse(err, rid, FN);
  }
});
