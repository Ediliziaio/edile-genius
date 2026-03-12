import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    // Verify callback token (server-to-server, not JWT)
    const callbackToken = req.headers.get("X-Callback-Token");
    const expectedToken = Deno.env.get("N8N_CALLBACK_SECRET");

    if (!expectedToken || callbackToken !== expectedToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { execution_db_id, status, output_data, error_message, n8n_execution_id } = await req.json();

    if (!execution_db_id) {
      return new Response(JSON.stringify({ error: "execution_db_id is required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: execution, error } = await supabase
      .from("n8n_executions")
      .update({
        status: status === "success" ? "completed" : "failed",
        output_data: output_data || null,
        error_message: error_message || null,
        n8n_execution_id: n8n_execution_id || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", execution_db_id)
      .select()
      .single();

    if (error) {
      console.error("Update execution error:", error);
      return new Response(JSON.stringify({ error: "Execution not found or update failed" }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, execution_id: execution.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
