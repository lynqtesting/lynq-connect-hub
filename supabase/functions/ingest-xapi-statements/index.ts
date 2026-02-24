import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type XapiStatement = {
  actor?: { mbox?: string; name?: string };
  verb?: { id?: string };
  object?: { id?: string; definition?: { name?: Record<string, string> } };
  result?: {
    score?: { scaled?: number; raw?: number };
    success?: boolean;
    completion?: boolean;
  };
  timestamp?: string;
  context?: {
    extensions?: Record<string, unknown>;
  };
};

function readRegionTag(statement: XapiStatement): string | null {
  const extensions = statement.context?.extensions ?? {};
  const keys = [
    "region",
    "region_tag",
    "https://lynq.ai/xapi/region",
    "https://example.com/region",
  ];

  for (const key of keys) {
    const value = extensions[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function readAssignedClient(statement: XapiStatement): string | null {
  const extensions = statement.context?.extensions ?? {};
  const keys = [
    "assigned",
    "client_id",
    "https://lynq.ai/xapi/assigned",
    "https://example.com/client",
  ];

  for (const key of keys) {
    const value = extensions[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { module_id, statements } = await req.json();

    if (!module_id || !Array.isArray(statements) || statements.length === 0) {
      return new Response(
        JSON.stringify({ error: "module_id and non-empty statements[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: moduleExists, error: moduleError } = await admin
      .from("modules")
      .select("id")
      .eq("id", module_id)
      .maybeSingle();

    if (moduleError || !moduleExists) {
      return new Response(JSON.stringify({ error: "Invalid module_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ingestionBatchId = crypto.randomUUID();

    const rows = (statements as XapiStatement[]).map((statement) => {
      const nameMap = statement.object?.definition?.name ?? {};
      const objectName =
        nameMap["en-US"] ??
        nameMap["en"] ??
        Object.values(nameMap)[0] ??
        null;

      return {
        module_id,
        actor_mbox: statement.actor?.mbox ?? null,
        actor_name: statement.actor?.name ?? null,
        verb_id: statement.verb?.id ?? null,
        object_id: statement.object?.id ?? null,
        object_name: objectName,
        score_scaled: statement.result?.score?.scaled ?? null,
        score_raw: statement.result?.score?.raw ?? null,
        success: statement.result?.success ?? null,
        completion: statement.result?.completion ?? null,
        statement_timestamp: statement.timestamp ?? null,
        region_tag: readRegionTag(statement),
        assigned_client_id: readAssignedClient(statement),
        raw_statement: statement,
        ingestion_batch_id: ingestionBatchId,
      };
    });

    const { error: insertError } = await admin.from("xapi_raw_statements").insert(rows);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        module_id,
        ingestion_batch_id: ingestionBatchId,
        ingested_count: rows.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("ingest-xapi-statements error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
