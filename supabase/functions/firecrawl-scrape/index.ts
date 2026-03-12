const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SSRF Protection
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
  if (BLOCKED_HOSTNAMES.includes(hostname)) return { safe: false, reason: "Hostname bloccato" };
  if (hostname === "[::1]" || hostname === "::1") return { safe: false, reason: "Loopback bloccato" };

  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 127 || a === 10 || a === 0) return { safe: false, reason: "IP bloccato" };
    if (a === 172 && b >= 16 && b <= 31) return { safe: false, reason: "IP privato bloccato" };
    if (a === 192 && b === 168) return { safe: false, reason: "IP privato bloccato" };
    if (a === 169 && b === 254) return { safe: false, reason: "Link-local bloccato" };
  }
  return { safe: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return json({ success: false, error: "URL è obbligatorio" }, 400);
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // SSRF check
    const urlCheck = isSafeUrl(formattedUrl);
    if (!urlCheck.safe) {
      return json({ success: false, error: `URL non consentito: ${urlCheck.reason}` }, 400);
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return json({ success: false, error: "Firecrawl non configurato. Aggiungi FIRECRAWL_API_KEY nei secrets." }, 500);
    }

    console.log("Scraping URL:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      return json(
        { success: false, error: data.error || `Firecrawl ha risposto con status ${response.status}` },
        response.status
      );
    }

    // Extract markdown from response (handle nested data structure)
    const markdown = data.data?.markdown || data.markdown || "";
    const title = data.data?.metadata?.title || data.metadata?.title || "";

    console.log("Scrape successful, markdown length:", markdown.length);

    return json({ success: true, markdown, title, url: formattedUrl });
  } catch (error) {
    console.error("firecrawl-scrape error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Errore interno" }, 500);
  }
});
