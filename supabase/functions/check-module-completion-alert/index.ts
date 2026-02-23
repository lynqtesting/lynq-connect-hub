/**
 * check-module-completion-alert
 *
 * Called whenever a user marks a module as complete.
 * Checks if the module has hit its completion threshold (default: 40).
 * If so, and the alert hasn't been sent yet, fires an HTML dashboard
 * summary email to the assigned admin/manager.
 *
 * Invoke from the React frontend via:
 *   supabase.functions.invoke('check-module-completion-alert', {
 *     body: { moduleId: '...', userId: '...' }
 *   })
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  moduleId: string;
  userId: string;
}

// ── HTML email template ───────────────────────────────────────────────────────
function buildDashboardEmail(
  moduleTitle: string,
  completionCount: number,
  threshold: number,
  riskData: Record<string, unknown> | null
): string {
  const str = riskData?.STR_overall
    ? `${Math.round((riskData.STR_overall as number) * 100)}%`
    : "N/A";
  const engagement = riskData?.engagement_rate_overall
    ? `${Math.round((riskData.engagement_rate_overall as number) * 100)}%`
    : "N/A";
  const dropoff = riskData?.["dropoff_rate_%"] ?? "N/A";
  const numRows = riskData?.num_rows ?? completionCount;

  const progress = riskData?.learning_progress_status as Record<string, number> | undefined;
  const completed = progress?.Completed ?? completionCount;
  const inProgress = progress?.["In Progress"] ?? 0;
  const notStarted = progress?.["Not Started"] ?? 0;

  const confusionAreas = (
    (riskData?.confusion_areas as Array<{ label: string; percentage: number }>) ?? []
  )
    .slice(0, 3)
    .map(
      (a) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${a.label}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right">
           <span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:9999px;font-size:12px">${a.percentage}%</span>
         </td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;color:#1f2937">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Dashboard Updated</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px">
      ${moduleTitle} has reached ${completionCount} completions
    </p>
  </div>

  <!-- Milestone banner -->
  <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 24px;margin:0">
    <p style="margin:0;color:#15803d;font-size:14px;font-weight:600">
      🎉 Milestone reached: ${completionCount}/${threshold} users completed this module
    </p>
    <p style="margin:4px 0 0;color:#166534;font-size:12px">
      The Risk Intelligence dashboard has been automatically updated with the latest learning data.
    </p>
  </div>

  <!-- KPI Grid -->
  <div style="padding:24px">
    <h2 style="margin:0 0 16px;font-size:16px;color:#374151">Key Metrics</h2>
    <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse:separate;border-spacing:8px">
      <tr>
        <td style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;width:25%">
          <div style="font-size:22px;font-weight:700;color:#6366f1">${str}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px">STR Score</div>
        </td>
        <td style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;width:25%">
          <div style="font-size:22px;font-weight:700;color:#22c55e">${engagement}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px">Engagement</div>
        </td>
        <td style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;width:25%">
          <div style="font-size:22px;font-weight:700;color:#f59e0b">${dropoff}%</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px">Drop-off Rate</div>
        </td>
        <td style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;width:25%">
          <div style="font-size:22px;font-weight:700;color:#3b82f6">${numRows}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px">Statements</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Learning Progress -->
  <div style="padding:0 24px 24px">
    <h2 style="margin:0 0 12px;font-size:16px;color:#374151">Learning Progress</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td style="padding:8px 0">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e"></span>
            <span style="font-size:13px">Completed</span>
            <span style="margin-left:auto;font-weight:700;font-size:13px">${completed}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #f3f4f6">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f59e0b"></span>
            <span style="font-size:13px">In Progress</span>
            <span style="margin-left:auto;font-weight:700;font-size:13px">${inProgress}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #f3f4f6">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#d1d5db"></span>
            <span style="font-size:13px">Not Started</span>
            <span style="margin-left:auto;font-weight:700;font-size:13px">${notStarted}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  ${
    confusionAreas
      ? `<!-- Confusion Areas -->
  <div style="padding:0 24px 24px">
    <h2 style="margin:0 0 12px;font-size:16px;color:#374151">Top Confusion Areas</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
      ${confusionAreas}
    </table>
  </div>`
      : ""
  }

  <!-- CTA -->
  <div style="padding:0 24px 32px;text-align:center">
    <p style="font-size:13px;color:#6b7280;margin-bottom:16px">
      Log in to your admin dashboard to view the full Risk Intelligence report.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#9ca3af">
      Automated notification from Lynq Connect Hub · ${new Date().getFullYear()}
    </p>
  </div>
</div>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { moduleId, userId }: RequestBody = await req.json();
    if (!moduleId || !userId) {
      return new Response(
        JSON.stringify({ error: "moduleId and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Mark the assignment as completed
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("user_module_assignments")
      .update({ completed_at: now })
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .is("completed_at", null);

    // 2. Count total completions for this module
    const { count } = await supabaseAdmin
      .from("user_module_assignments")
      .select("id", { count: "exact", head: true })
      .eq("module_id", moduleId)
      .not("completed_at", "is", null);

    const completionCount = count ?? 0;

    // 3. Fetch module details
    const { data: module, error: moduleError } = await supabaseAdmin
      .from("modules")
      .select(
        "id, title, completion_threshold, completion_alert_fired, kpis, xapi_data"
      )
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      throw new Error("Module not found");
    }

    const threshold = module.completion_threshold ?? 40;

    // 4. If threshold not yet reached or alert already sent, return early
    if (completionCount < threshold || module.completion_alert_fired) {
      return new Response(
        JSON.stringify({
          success: true,
          completionCount,
          threshold,
          alertSent: false,
          reason:
            completionCount < threshold
              ? "threshold_not_reached"
              : "alert_already_sent",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Build the risk data for the email (prefer xapi_data, fall back to kpis)
    const riskData =
      (module.xapi_data as Record<string, unknown> | null) ??
      ((module.kpis as Record<string, unknown> | null)?.risk_intelligence as
        | Record<string, unknown>
        | null) ??
      null;

    const emailHtml = buildDashboardEmail(
      module.title,
      completionCount,
      threshold,
      riskData
    );

    // 6. Send email
    const emailResult = await resend.emails.send({
      from: "Lynq Intelligence <onboarding@resend.dev>",
      to: ["ishanibehl@skillopp.com"],
      subject: `${module.title} Dashboard Has Been Updated`,
      html: emailHtml,
    });

    console.log("Dashboard alert email sent:", emailResult.data?.id);

    // 7. Mark alert as fired so it doesn't send again
    await supabaseAdmin
      .from("modules")
      .update({
        completion_alert_fired: true,
        completion_alert_sent_at: now,
      })
      .eq("id", moduleId);

    return new Response(
      JSON.stringify({
        success: true,
        completionCount,
        threshold,
        alertSent: true,
        emailId: emailResult.data?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("check-module-completion-alert error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
