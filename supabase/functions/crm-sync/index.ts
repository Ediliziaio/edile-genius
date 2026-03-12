import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CrmContact {
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  source: string;
}

async function fetchHubSpotContacts(apiKey: string): Promise<CrmContact[]> {
  const contacts: CrmContact[] = [];
  let after: string | undefined;
  
  do {
    const url = new URL("https://api.hubapi.com/crm/v3/objects/contacts");
    url.searchParams.set("limit", "100");
    url.searchParams.set("properties", "firstname,lastname,email,phone,company");
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HubSpot API error ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    for (const c of data.results || []) {
      const p = c.properties || {};
      const name = [p.firstname, p.lastname].filter(Boolean).join(" ").trim();
      if (!name) continue;
      contacts.push({
        full_name: name,
        email: p.email || null,
        phone: p.phone || null,
        company_name: p.company || null,
        source: "hubspot",
      });
    }
    after = data.paging?.next?.after;
  } while (after && contacts.length < 1000);

  return contacts;
}

async function fetchPipedriveContacts(apiKey: string): Promise<CrmContact[]> {
  const contacts: CrmContact[] = [];
  let start = 0;

  do {
    const url = `https://api.pipedrive.com/v1/persons?start=${start}&limit=100&api_token=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pipedrive API error ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Pipedrive API error");

    for (const p of data.data || []) {
      contacts.push({
        full_name: p.name || "",
        email: p.primary_email || (p.email?.[0]?.value) || null,
        phone: p.phone?.[0]?.value || null,
        company_name: p.org_name || null,
        source: "pipedrive",
      });
    }

    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start += 100;
  } while (contacts.length < 1000);

  return contacts;
}

async function fetchSalesforceContacts(apiKey: string, instanceUrl: string): Promise<CrmContact[]> {
  const query = encodeURIComponent("SELECT Id, FirstName, LastName, Email, Phone, Account.Name FROM Contact LIMIT 1000");
  const url = `${instanceUrl}/services/data/v59.0/query?q=${query}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Salesforce API error ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  return (data.records || []).map((r: any) => ({
    full_name: [r.FirstName, r.LastName].filter(Boolean).join(" ").trim(),
    email: r.Email || null,
    phone: r.Phone || null,
    company_name: r.Account?.Name || null,
    source: "salesforce",
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await serviceClient.from("profiles").select("company_id").eq("id", userId).single();

    const body = await req.json();
    const { action, provider, api_key, instance_url, company_id } = body;

    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id required" }), { status: 400, headers: corsHeaders });
    }

    // Tenant verification
    const { data: roles } = await serviceClient.from("user_roles").select("role").eq("user_id", userId);
    const isSA = (roles || []).some((r: any) => r.role === "superadmin" || r.role === "superadmin_user");
    if (!isSA && profile?.company_id !== company_id) {
      return new Response(JSON.stringify({ error: "Forbidden: cross-tenant access" }), { status: 403, headers: corsHeaders });
    }

    // TEST CONNECTION
    if (action === "test_connection") {
      if (!provider || !api_key) {
        return new Response(JSON.stringify({ error: "provider and api_key required" }), { status: 400, headers: corsHeaders });
      }

      try {
        let count = 0;
        if (provider === "hubspot") {
          const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
            headers: { Authorization: `Bearer ${api_key}` },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          count = data.total || 0;
        } else if (provider === "pipedrive") {
          const res = await fetch(`https://api.pipedrive.com/v1/persons?start=0&limit=1&api_token=${api_key}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || "API error");
          count = data.additional_data?.pagination?.total_count || 0;
        } else if (provider === "salesforce") {
          if (!instance_url) throw new Error("instance_url required for Salesforce");
          const res = await fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent("SELECT COUNT() FROM Contact")}`, {
            headers: { Authorization: `Bearer ${api_key}` },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          count = data.totalSize || 0;
        } else {
          throw new Error("Unknown provider");
        }

        return new Response(JSON.stringify({ success: true, contacts_count: count }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 400, headers: corsHeaders,
        });
      }
    }

    // SAVE INTEGRATION
    if (action === "save_integration") {
      if (!provider || !api_key) {
        return new Response(JSON.stringify({ error: "provider and api_key required" }), { status: 400, headers: corsHeaders });
      }

      // Encrypt API key before storing
      let storedKey = api_key;
      const encKey = Deno.env.get("META_ENCRYPTION_KEY");
      if (encKey && encKey.length === 64) {
        const { encryptToken } = await import("../_shared/crypto.ts");
        storedKey = await encryptToken(api_key, encKey);
      }

      const { error } = await supabase.from("company_integrations").upsert({
        company_id,
        provider,
        api_key_encrypted: storedKey,
        instance_url: instance_url || null,
        is_active: true,
        status: "connected",
        updated_at: new Date().toISOString(),
      }, { onConflict: "company_id,provider" });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DISCONNECT
    if (action === "disconnect") {
      if (!provider) {
        return new Response(JSON.stringify({ error: "provider required" }), { status: 400, headers: corsHeaders });
      }

      await supabase.from("company_integrations").update({
        is_active: false,
        status: "disconnected",
        api_key_encrypted: null,
        updated_at: new Date().toISOString(),
      }).eq("company_id", company_id).eq("provider", provider);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SYNC CONTACTS
    if (action === "sync_contacts") {
      if (!provider) {
        return new Response(JSON.stringify({ error: "provider required" }), { status: 400, headers: corsHeaders });
      }

      // Get integration config
      const { data: integration } = await supabase
        .from("company_integrations")
        .select("*")
        .eq("company_id", company_id)
        .eq("provider", provider)
        .single();

      if (!integration || !integration.api_key_encrypted) {
        return new Response(JSON.stringify({ error: "Integration not configured" }), { status: 400, headers: corsHeaders });
      }

      const integ = integration as any;

      // Decrypt API key if encrypted
      let apiKeyPlain = integ.api_key_encrypted;
      const encKey = Deno.env.get("META_ENCRYPTION_KEY");
      if (encKey && encKey.length === 64) {
        try {
          const { decryptToken } = await import("../_shared/crypto.ts");
          apiKeyPlain = await decryptToken(integ.api_key_encrypted, encKey);
        } catch {
          // Key might not be encrypted (legacy), use as-is
        }
      }

      try {
        let crmContacts: CrmContact[] = [];

        if (provider === "hubspot") {
          crmContacts = await fetchHubSpotContacts(apiKeyPlain);
        } else if (provider === "pipedrive") {
          crmContacts = await fetchPipedriveContacts(apiKeyPlain);
        } else if (provider === "salesforce") {
          if (!integ.instance_url) throw new Error("Salesforce instance_url missing");
          crmContacts = await fetchSalesforceContacts(apiKeyPlain, integ.instance_url);
        }

        // Upsert contacts — match by email or phone
        let imported = 0;
        let skipped = 0;

        for (const c of crmContacts) {
          if (!c.full_name) { skipped++; continue; }

          // Check for existing contact by email or phone
          let exists = false;
          if (c.email) {
            const { data: existing } = await supabase
              .from("contacts")
              .select("id")
              .eq("company_id", company_id)
              .eq("email", c.email)
              .limit(1);
            if (existing && existing.length > 0) { exists = true; }
          }
          if (!exists && c.phone) {
            const { data: existing } = await supabase
              .from("contacts")
              .select("id")
              .eq("company_id", company_id)
              .eq("phone", c.phone)
              .limit(1);
            if (existing && existing.length > 0) { exists = true; }
          }

          if (exists) { skipped++; continue; }

          const { error: insertErr } = await supabase.from("contacts").insert({
            company_id,
            full_name: c.full_name,
            email: c.email,
            phone: c.phone,
            company_name: c.company_name,
            source: c.source,
            status: "new",
          });

          if (insertErr) { skipped++; } else { imported++; }
        }

        // Update integration status
        await supabase.from("company_integrations").update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success",
          last_sync_count: imported,
          updated_at: new Date().toISOString(),
        }).eq("company_id", company_id).eq("provider", provider);

        return new Response(JSON.stringify({
          success: true,
          imported,
          skipped,
          total: crmContacts.length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        await supabase.from("company_integrations").update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: `error: ${(err as Error).message}`,
          updated_at: new Date().toISOString(),
        }).eq("company_id", company_id).eq("provider", provider);

        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 500, headers: corsHeaders,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
