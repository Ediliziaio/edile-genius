import { corsHeaders, generateRequestId, jsonOk, jsonError, errorResponse, log, fetchWithTimeout } from "../_shared/utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "generate-floor-render";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { image_base64, mime_type, prompt, system_prompt, session_id, target_width, target_height } = await req.json();
    if (!image_base64 || !prompt) return jsonError("image_base64 and prompt are required", "validation_error", 400, rid);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", "system_error", 500, rid);

    // Pre-flight credit check — fetch company_id from session before calling AI
    let sessionCompanyId: string | null = null;
    if (session_id) {
      const { data: sess } = await supabase.from("render_pavimento_sessions").select("company_id").eq("id", session_id).single() as any;
      sessionCompanyId = sess?.company_id || null;
    }
    if (!sessionCompanyId) {
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      sessionCompanyId = profile?.company_id || null;
    }
    if (sessionCompanyId) {
      const { data: preCheck } = await supabase.from("render_credits").select("balance").eq("company_id", sessionCompanyId).single();
      if (!preCheck || preCheck.balance <= 0) {
        return jsonError("No render credits available", "insufficient_credits", 402, rid);
      }
    }

    log("info", "Generating floor render", { request_id: rid, fn: FN, session_id, prompt_length: prompt?.length });

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          ...(system_prompt ? [{ role: "system", content: system_prompt }] : []),
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mime_type || "image/jpeg"};base64,${image_base64}` } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    }, 120_000);

    if (!response.ok) {
      if (response.status === 429) return jsonError("Rate limit exceeded", "rate_limited", 429, rid);
      if (response.status === 402) return jsonError("Payment required", "payment_required", 402, rid);
      const errText = await response.text();
      log("error", "AI Gateway error", { request_id: rid, fn: FN, status: response.status, body: errText.slice(0, 500) });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const parts = data.choices?.[0]?.message?.content;

    // Also check the images field (Nano banana format)
    const imagesField = data.choices?.[0]?.message?.images;

    let resultBase64 = "";
    let resultUrl = "";

    // Try images field first (Nano banana response format)
    if (Array.isArray(imagesField) && imagesField.length > 0) {
      const imgUrl = imagesField[0]?.image_url?.url;
      if (imgUrl?.startsWith("data:image")) {
        resultBase64 = imgUrl.split(",")[1] || "";
      } else if (imgUrl) {
        resultUrl = imgUrl;
      }
    }
    // Then try content field
    else if (typeof parts === "string") {
      if (parts.startsWith("data:image")) {
        resultBase64 = parts.split(",")[1] || "";
      } else {
        return jsonError("AI did not return an image. Try a different prompt.", "no_image", 422, rid);
      }
    } else if (Array.isArray(parts)) {
      const imgPart = parts.find((p: any) => p.type === "image_url" || p.inlineData);
      if (imgPart?.image_url?.url) {
        resultUrl = imgPart.image_url.url;
        if (resultUrl.startsWith("data:image")) {
          resultBase64 = resultUrl.split(",")[1] || "";
          resultUrl = "";
        }
      } else if (imgPart?.inlineData?.data) {
        resultBase64 = imgPart.inlineData.data;
      }
    }

    if (!resultBase64 && !resultUrl) {
      return jsonError("AI did not return an image.", "no_image", 422, rid);
    }

    // Upload to storage if we have base64
    if (resultBase64 && session_id) {
      const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const bStr = atob(resultBase64);
      const bArr = new Uint8Array(bStr.length);
      for (let i = 0; i < bStr.length; i++) bArr[i] = bStr.charCodeAt(i);
      const path = `renders/${session_id}/result.jpg`;
      const { error: upErr } = await supa.storage.from("pavimento-results").upload(path, bArr, { contentType: "image/jpeg", upsert: true });
      if (!upErr) {
        const { data: urlData } = supa.storage.from("pavimento-results").getPublicUrl(path);
        resultUrl = urlData.publicUrl;
        await supa.from("render_pavimento_sessions")
          .update({ result_image_url: resultUrl, prompt_usato: prompt, status: "completed" } as any)
          .eq("id", session_id);

        // Atomic deduction with FOR UPDATE lock — uses company_id resolved at start
        if (sessionCompanyId) {
          const { data: deductResult } = await supabase.rpc("deduct_render_credit", { _company_id: sessionCompanyId });
          if (deductResult === "insufficient") {
            return jsonError("No render credits", "insufficient_credits", 402, rid);
          }
        }
      }
    }

    log("info", "Floor render generated", { request_id: rid, fn: FN, has_result: !!(resultBase64 || resultUrl) });
    return jsonOk({
      result_url: resultUrl,
      result_image_url: resultUrl,
      result_base64: resultBase64 ? `data:image/jpeg;base64,${resultBase64}` : undefined,
    }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
