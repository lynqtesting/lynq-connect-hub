import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Row = {
  actor_mbox: string | null;
  object_id: string | null;
  object_name: string | null;
  score_scaled: number | null;
  success: boolean | null;
  completion: boolean | null;
  region_tag: string | null;
};

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
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

    const { module_id, from_ts, to_ts } = await req.json();

    if (!module_id) {
      return new Response(JSON.stringify({ error: "module_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let query = admin
      .from("xapi_raw_statements")
      .select("actor_mbox, object_id, object_name, score_scaled, success, completion, region_tag")
      .eq("module_id", module_id)
      .order("statement_timestamp", { ascending: false });

    if (from_ts) query = query.gte("statement_timestamp", from_ts);
    if (to_ts) query = query.lte("statement_timestamp", to_ts);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Row[];
    const scores = rows.map((r) => r.score_scaled).filter((v): v is number => typeof v === "number");

    const uniqueLearners = new Set(rows.map((r) => r.actor_mbox).filter(Boolean));
    const successFalse = rows.filter((r) => r.success === false).length;

    const progress = {
      Completed: rows.filter((r) => r.completion === true).length,
      "In Progress": rows.filter((r) => r.completion === false).length,
      "Not Started": 0,
    };

    const regionMap = new Map<string, number[]>();
    for (const row of rows) {
      const region = row.region_tag?.trim() || "Unknown";
      if (typeof row.score_scaled !== "number") continue;
      if (!regionMap.has(region)) regionMap.set(region, []);
      regionMap.get(region)!.push(row.score_scaled);
    }

    const regionWiseStr: Record<string, number> = {};
    for (const [region, vals] of regionMap.entries()) {
      regionWiseStr[region] = round2(avg(vals));
    }

    const objectStats = new Map<string, { label: string; total: number; failed: number }>();
    for (const row of rows) {
      const key = row.object_id ?? "unknown_object";
      const label = row.object_name || row.object_id || "Unknown Object";
      if (!objectStats.has(key)) objectStats.set(key, { label, total: 0, failed: 0 });
      const stat = objectStats.get(key)!;
      stat.total += 1;
      if (row.success === false) stat.failed += 1;
    }

    const { data: moduleConfig } = await admin
      .from("modules")
      .select("xapi_confusion_threshold_pct")
      .eq("id", module_id)
      .maybeSingle();

    const threshold = Number(moduleConfig?.xapi_confusion_threshold_pct ?? 25);
    const confusionAreas = Array.from(objectStats.values())
      .map((stat) => ({
        label: stat.label,
        percentage: stat.total ? round2((stat.failed / stat.total) * 100) : 0,
      }))
      .filter((x) => x.percentage >= threshold)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    const snapshot = {
      STR_overall: round2(avg(scores)),
      engagement_rate_overall: rows.length ? round2(uniqueLearners.size / rows.length) : 0,
      objective_score_overall: round2(avg(scores)),
      productivity_time_saved_avg_hours: 0,
      dropoff_rate_%: rows.length ? round2((successFalse / rows.length) * 100) : 0,
      num_rows: rows.length,
      learning_progress_status: progress,
      region_wise_STR: regionWiseStr,
      client_objection_region_wise: {},
      cod_by_theme: {},
      cod_total_hits: 0,
      confusion_areas: confusionAreas,
    };

    const insertPayload = {
      module_id,
      snapshot_json: snapshot,
      str_overall: snapshot.STR_overall,
      objective_score_overall: snapshot.objective_score_overall,
      engagement_rate_overall: snapshot.engagement_rate_overall,
      dropoff_rate_pct: snapshot.dropoff_rate_%,
      num_rows: snapshot.num_rows,
      computed_from_start: from_ts ?? null,
      computed_from_end: to_ts ?? null,
      status: "finalized",
    };

    const { data: inserted, error: insertError } = await admin
      .from("risk_snapshots")
      .insert(insertPayload)
      .select("id, created_at")
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, snapshot_id: inserted.id, created_at: inserted.created_at, snapshot }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("build-risk-snapshot error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
