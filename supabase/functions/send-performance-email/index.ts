/**
 * send-performance-email
 *
 * Sends a branded LYNQ Performance Update email to a client/user.
 * Triggered manually by an admin clicking "SEND EMAIL" on the user list.
 *
 * Body: { userId: string, moduleId: string }
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function pct(val: unknown): string {
  if (val === null || val === undefined) return "N/A";
  const n = Number(val);
  if (isNaN(n)) return "N/A";
  // Values ≤ 1 are decimals (e.g. 0.72 → 72%)
  return `${Math.round(n <= 1 ? n * 100 : n)}`;
}

function num(val: unknown, fallback = "N/A"): string {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : String(Math.round(n));
}

// ── Email template (user-supplied design) ─────────────────────────────────────

function buildEmail(vars: {
  clientName: string;
  stakeholderName: string;
  date: string;
  engagementRate: string;
  moduleName: string;
  strScore: string;
  completionRate: string;
  timeSaved: string;
  atRisk: string;
  moduleCategory: string;
  moduleLink: string;
}): string {
  const {
    clientName,
    stakeholderName,
    date,
    engagementRate,
    moduleName,
    strScore,
    completionRate,
    timeSaved,
    atRisk,
    moduleCategory,
    moduleLink,
  } = vars;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LYNQ Performance Update</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f6; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
    .header { background: #0a0a0f; padding: 32px; text-align: center; }
    .lynq-logo { font-size: 13px; letter-spacing: 4px; color: #6366f1; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
    .header-title { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin: 0; }
    .header-sub { color: #555; font-size: 12px; margin: 8px 0 0; }
    .congrats-band { background: linear-gradient(135deg, #052e16, #064e3b); padding: 24px 32px; text-align: center; border-bottom: 1px solid #065f46; }
    .congrats-emoji { font-size: 32px; margin-bottom: 8px; }
    .congrats-text { color: #6ee7b7; font-size: 15px; font-weight: 600; line-height: 1.5; margin: 0; }
    .congrats-text span { color: #ffffff; }
    .metric-hero { padding: 32px; text-align: center; border-bottom: 1px solid #f0f0f0; }
    .metric-number { font-size: 64px; font-weight: 800; color: #0a0a0f; line-height: 1; letter-spacing: -2px; }
    .metric-number span { color: #6366f1; }
    .metric-label { font-size: 14px; color: #666; margin: 12px 0 0; line-height: 1.6; }
    .metric-label strong { color: #0a0a0f; }
    .stats-row { display: flex; border-bottom: 1px solid #f0f0f0; }
    .stat-box { flex: 1; padding: 20px 16px; text-align: center; border-right: 1px solid #f0f0f0; }
    .stat-box:last-child { border-right: none; }
    .stat-num { font-size: 24px; font-weight: 800; color: #0a0a0f; }
    .stat-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .module-band { background: #fafafa; border-bottom: 1px solid #f0f0f0; padding: 20px 32px; }
    .module-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
    .module-name { font-size: 16px; font-weight: 700; color: #0a0a0f; }
    .module-tag { display: inline-block; background: #ede9fe; color: #6366f1; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }
    .body { padding: 28px 32px; }
    .body p { font-size: 14px; color: #555; line-height: 1.8; margin: 0 0 16px; }
    .body p strong { color: #0a0a0f; }
    .str-box { background: #f5f3ff; border-left: 3px solid #6366f1; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; }
    .str-box p { margin: 0; font-size: 13px; color: #4c1d95; line-height: 1.7; }
    .cta-wrap { text-align: center; padding: 8px 32px 28px; }
    .cta { display: inline-block; background: #0a0a0f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
    .footer { background: #fafafa; border-top: 1px solid #f0f0f0; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 11px; color: #bbb; margin: 0; line-height: 1.8; }
    .footer a { color: #6366f1; text-decoration: none; }
    .from-line { font-size: 12px; color: #888; margin-bottom: 8px !important; }
  </style>
</head>
<body>
  <div class="wrap">

    <div class="header">
      <div class="lynq-logo">LYNQ</div>
      <h1 class="header-title">Performance Update</h1>
      <p class="header-sub">${clientName} · ${date}</p>
    </div>

    <div class="congrats-band">
      <div class="congrats-emoji">🎉</div>
      <p class="congrats-text">
        Congratulations — the LYNQ module led to
        <span>${engagementRate}% engagement</span>,
        which means <span>${engagementRate}% of your workforce can sell better.</span>
      </p>
    </div>

    <div class="metric-hero">
      <div class="metric-number"><span>${engagementRate}</span>%</div>
      <p class="metric-label">
        of your workforce is now equipped to sell
        <strong>${moduleName}</strong> with confidence.<br>
        STR Score: <strong>${strScore}</strong> — your team's comprehension benchmark.
      </p>
    </div>

    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-num">${completionRate}%</div>
        <div class="stat-label">Completion</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${strScore}</div>
        <div class="stat-label">STR Score</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${timeSaved}h</div>
        <div class="stat-label">Time Saved</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${atRisk}</div>
        <div class="stat-label">Need Attention</div>
      </div>
    </div>

    <div class="module-band">
      <div class="module-label">Module / Regulation Covered</div>
      <div class="module-name">${moduleName}</div>
      <span class="module-tag">${moduleCategory}</span>
    </div>

    <div class="body">
      <p>Hi ${stakeholderName},</p>
      <p>
        Your team has just completed the <strong>${moduleName}</strong> module on LYNQ.
        The numbers above reflect not just who finished — but who genuinely understood
        what they need to know to have better conversations with your customers.
      </p>

      <div class="str-box">
        <p>
          <strong>What does the STR Score mean?</strong> The STR (Sell-Through Readiness) Score
          measures how deeply your workforce has understood the product or regulation covered —
          not just whether they clicked through. A score of <strong>${strScore}</strong> means
          your team is at that level of readiness to represent <strong>${moduleName}</strong>
          accurately and confidently in a customer conversation.
        </p>
      </div>

      <p>
        <strong>${atRisk} employees</strong> showed lower engagement and may benefit from
        a quick follow-up before their next customer interaction. Your LYNQ dashboard has
        their names and specific drop-off points flagged.
      </p>

      <p>
        This is your team's readiness — visible, measurable, and actionable.
        Not just a completion certificate. Real intelligence.
      </p>
    </div>

    <div class="cta-wrap">
      <a href="${moduleLink}" class="cta">View Full Dashboard →</a>
    </div>

    <div class="footer">
      <p class="from-line">Sent by Ishani Behl · <a href="mailto:ishanibehl@skillopp.com">ishanibehl@skillopp.com</a></p>
      <p>
        LYNQ Learning Intelligence Platform ·
        You're receiving this because you're a registered stakeholder for ${clientName}.<br>
        To update preferences, reply to this email.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
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

    const { userId, moduleId } = await req.json();
    if (!userId || !moduleId) {
      return new Response(
        JSON.stringify({ error: "userId and moduleId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get recipient email from auth.users
    const { data: { user: authUser }, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !authUser?.email) {
      throw new Error("Could not find user email");
    }
    const recipientEmail = authUser.email;

    // 2. Get user profile for display name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .single();
    const clientName = profile?.username ?? recipientEmail.split("@")[0];

    // 3. Get module + KPI data
    const { data: module, error: moduleError } = await supabaseAdmin
      .from("modules")
      .select("id, title, kpis, xapi_data")
      .eq("id", moduleId)
      .single();
    if (moduleError || !module) throw new Error("Module not found");

    // Prefer xapi_data, fall back to kpis.risk_intelligence
    const kpis: Record<string, unknown> =
      (module.xapi_data as Record<string, unknown> | null) ??
      ((module.kpis as Record<string, unknown> | null)
        ?.risk_intelligence as Record<string, unknown>) ??
      (module.kpis as Record<string, unknown> | null) ??
      {};

    // 4. Derive template variables
    const engagementRate = pct(kpis.engagement_rate_overall);
    const strRaw = kpis.STR_overall ?? kpis.str_overall ?? kpis.STR;
    const strScore = pct(strRaw);

    const progress = kpis.learning_progress_status as
      | Record<string, number>
      | undefined;
    const completed = progress?.Completed ?? progress?.completed ?? 0;
    const notStarted =
      progress?.["Not Started"] ??
      progress?.["Not-Started"] ??
      progress?.notStarted ??
      0;
    const totalLearners =
      (progress
        ? Object.values(progress).reduce((a, b) => a + b, 0)
        : 0) || 1;
    const completionRate = num(Math.round((Number(completed) / totalLearners) * 100));
    const timeSaved = num(kpis.productivity_time_saved_avg_hours, "N/A");
    const atRisk = num(notStarted, "0");

    const moduleCategory =
      (kpis.category as string) ??
      (kpis.module_type as string) ??
      "LYNQ Module";

    const appUrl = Deno.env.get("APP_URL") ?? "https://dashboard.lynq.ai";
    const moduleLink = `${appUrl}/module/${module.id}`;

    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 5. Build and send email
    const html = buildEmail({
      clientName,
      stakeholderName: clientName,
      date,
      engagementRate,
      moduleName: module.title,
      strScore,
      completionRate,
      timeSaved,
      atRisk,
      moduleCategory,
      moduleLink,
    });

    const emailResult = await resend.emails.send({
      from: "Ishani Behl | LYNQ <onboarding@resend.dev>",
      to: [recipientEmail],
      reply_to: "ishanibehl@skillopp.com",
      subject: `LYNQ Performance Update — ${module.title}`,
      html,
    });

    console.log("Performance email sent:", emailResult.data?.id, "→", recipientEmail);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.data?.id, sentTo: recipientEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-performance-email error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
