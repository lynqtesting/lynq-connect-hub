import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ExternalLink, HelpCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RequestLynqModal from "@/components/RequestLynqModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Use design tokens for colors
const cPrimary = "hsl(var(--primary))";
const cAccent = "hsl(var(--accent))";
const cDestructive = "hsl(var(--destructive))";
const cBar = "hsl(var(--foreground))";
const grid = "#eef2f7"; // subtle neutral for grids only

export interface LynqSleekProps {
  moduleTitle?: string;
  moduleLink?: string;
  // Optional overrides (fallback to sensible defaults)
  kpis?: { completion: number; engagement: number; opening: number; rating: number; learners: number };
  trend?: Array<{ day: string; completion: number; engagement: number }>;
  confusionData?: Array<{ name: string; value: number }>;
  perception?: Array<{ metric: string; value: number; target: number }>;
  objections?: Array<{ name: string; pct: number }>;
  summaryText?: string;
  audioUrl?: string;
  adaptiveModules?: Array<{ id: number; type: string; description: string; added: boolean }>;
  tweakContentRequest?: string;
}

const defaultKpis = { completion: 87, engagement: 92, opening: 78, rating: 3.0, learners: 200 };
const defaultTrend = [
  { day: "Mon", completion: 82, engagement: 90 },
  { day: "Tue", completion: 88, engagement: 92 },
  { day: "Wed", completion: 85, engagement: 91 },
  { day: "Thu", completion: 89, engagement: 93 },
  { day: "Fri", completion: 87, engagement: 92 },
];
const defaultConfusion = [
  { name: "Fixed Payout Confusion", value: 65 },
  { name: "Firebase Setup Confusion", value: 42 },
];
const defaultPerception = [
  { metric: "Trust", value: 72, target: 80 },
  { metric: "Value", value: 58, target: 75 },
  { metric: "Ease of Use", value: 85, target: 85 },
  { metric: "Relevance", value: 78, target: 80 },
  { metric: "Credibility", value: 65, target: 80 },
];
const defaultObjections = [
  { name: "High Costs", pct: 65 },
  { name: "Complex Process", pct: 42 },
  { name: "Trust Issues", pct: 28 },
];

export default function LynqSleekView({
  moduleTitle = "Lynq",
  moduleLink,
  kpis = defaultKpis,
  trend = defaultTrend,
  confusionData = defaultConfusion,
  perception = defaultPerception,
  objections = defaultObjections,
  summaryText,
  audioUrl,
  adaptiveModules = [],
  tweakContentRequest,
}: LynqSleekProps) {
  
  // Test logging to verify data is being passed correctly
  console.log('🔍 LynqSleekView - Received data:', {
    moduleTitle,
    adaptiveModules,
    tweakContentRequest,
    confusionData,
    perception,
    objections,
    kpis,
    hasAudioUrl: !!audioUrl
  });
  const [tab, setTab] = useState<"trend" | "confusion" | "perception" | "objections">("objections");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [tweakingQuestions, setTweakingQuestions] = useState<any[]>([]);
  const { moduleId } = useParams();

  useEffect(() => {
    document.title = `${moduleTitle} – Lynq Dashboard`;
  }, [moduleTitle]);

  useEffect(() => {
    fetchTweakingQuestions();
  }, []);

  const fetchTweakingQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('tweakable_questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTweakingQuestions(data || []);
    } catch (error) {
      console.error('Error fetching tweaking questions:', error);
    }
  };

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Success", description: "Logged out" });
      navigate('/login');
    } catch (e) {
      toast({ title: "Error", description: "Failed to log out", variant: 'destructive' });
    }
  };

  const textSummary = useMemo(
    () => summaryText ?? `Quick pulse: engagement ${kpis.engagement}%, completion ${kpis.completion}%, opening ${kpis.opening}%. Build an ROI calculator next.`,
    [kpis, summaryText]
  );

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <TooltipProvider>
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-4">
        {/* Header */}
        <header className="sticky top-0 z-20 -mx-4 px-4 pt-3 pb-2 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-2xl bg-foreground text-background grid place-items-center font-black">L</div>
              <div className="font-extrabold tracking-tight">LYNQ</div>
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">Adaptive</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/lynq-library')}>Library</Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </header>

        {/* Keep existing View Lynq button (unchanged intention) */}
        {moduleLink && (
          <Button
            onClick={() => window.open(moduleLink, "_blank")}
            className="w-full mt-4"
            size="lg"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            View Lynq
          </Button>
        )}

        {/* KPI Grid */}
        <KPIGrid kpis={kpis} />

        {/* Audio Summary */}
        <Card title="Summary" className="mt-3">
          <p className="text-xs text-muted-foreground mb-3">{textSummary}</p>
          {audioUrl ? (
            <audio controls className="w-full" src={audioUrl} preload="none" />
          ) : (
            <Button onClick={() => navigate('/lynq-library')} className="w-full" size="lg" variant="default">
              Play
            </Button>
          )}
        </Card>

        {/* Graph Section Title */}
        <div className="mt-6 mb-4">
          <h2 className="text-lg font-bold text-center text-foreground">
            What your employees and market is saying about your product/concept
          </h2>
        </div>

        {/* Tabs + Charts */}
        <div className="mt-3">
          <div className="grid grid-cols-4 gap-2 bg-muted p-1 rounded-2xl">
            {[
              { label: "Trend", value: "trend" },
              { label: "Confusion", value: "confusion" },
              { label: "Perception", value: "perception" },
              { label: "Top Client Objections", value: "objections" },
            ].map((i) => (
              <button
                key={i.value}
                onClick={() => setTab(i.value as any)}
                className={`py-2 rounded-xl text-sm font-semibold transition ${
                  tab === (i.value as any) ? "bg-card shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>

          <Card
            className="mt-2 w-full min-w-[60vw] max-w-full mx-auto"
            title={
              tab === "trend" ? "Trend" : 
              tab === "confusion" ? "Confusion" : 
              tab === "perception" ? "Perception (X-axis: High Sentiment Parameter, Y-axis: Product Variables)" : 
              "Top Client Objections"
            }
          >
            <div className="h-80 w-full" style={{ pointerEvents: 'none' }}>
              {tab === "trend" && (
                <div style={{ pointerEvents: 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={cPrimary} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={cPrimary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis hide domain={[60, 100]} />
                      <ReTooltip cursor={{ fill: "#00000008" }} formatter={(v: any) => [`${v}%`]} />
                      <Area dataKey="completion" stroke={cPrimary} strokeWidth={2} fill="url(#g1)" type="monotone" />
                      <Area dataKey="engagement" stroke={cAccent} strokeWidth={2} fillOpacity={0} type="monotone" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {tab === "confusion" && (
                <div style={{ pointerEvents: 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={confusionData} layout="vertical" margin={{ left: 20, right: 40, top: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
                      <ReTooltip cursor={{ fill: "#00000008" }} formatter={(v: any) => [`${v}%`, "Confusion"]} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={cBar}>
                        {confusionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={cBar} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {tab === "perception" && (
                <div style={{ pointerEvents: 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perception} layout="vertical" margin={{ left: 20, right: 40, top: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="metric" width={160} tick={{ fontSize: 11 }} />
                      <ReTooltip
                        cursor={{ fill: "#00000008" }}
                        formatter={(v: any, _n: any, ctx: any) => [`${v}% (target ${ctx?.payload?.target ?? 0}%)`, "Value"]}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={cBar}>
                        {perception.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={cBar} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {tab === "objections" && (
                <div style={{ pointerEvents: 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={objections} layout="vertical" margin={{ left: 20, right: 40, top: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
                      <ReTooltip cursor={{ fill: "#00000008" }} formatter={(v: any) => [`${v}%`, "Learners affected"]} />
                      <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill={cBar}>
                        {objections.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={cBar} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Actions & Improvements */}
        <Card title="Actions & Improvements" className="mt-3">
          <div className="text-[13px] font-semibold text-foreground mb-2 flex items-center gap-2">
            Next Adaptive Lynqs
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">
                    📈 Create new bite-sized modules that sharpen learning and uncover fresh insights 🔍 on your product.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-3">
            {Array.isArray(adaptiveModules) && adaptiveModules.filter(m => m?.added ?? true).length > 0 ? (
              adaptiveModules
                .filter(m => m?.added ?? true)
                .map((m) => (
                       <ActionRow
                        key={m.id}
                        title={m.type}
                        subtitle={m.description || "No description provided"}
                        cta="Request Adaptive LYNQ"
                        onClick={() => setRequestModalOpen(true)}
                      />
                ))
            ) : (
               <ActionRow
                  title="No adaptive lynqs yet"
                  subtitle="Request a new adaptive LYNQ to be created for this module."
                  cta="Request Adaptive LYNQ"
                  onClick={() => setRequestModalOpen(true)}
                />
            )}
          </div>
        </Card>

        {/* Tweak the LYNQ */}
        <Card className="mt-3">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[13px] font-semibold">Tweak the LYNQ</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">
                    🛠️ Refine existing modules up to three times—improving clarity ✅ while gathering deeper insights 💡 on your team's understanding.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-3">
            {tweakingQuestions.length > 0 ? (
              tweakingQuestions.map((question) => (
                <TweakCard
                  key={question.id}
                  title={question.title}
                  subtitle="Share materials or notes to refine this LYNQ"
                  cta="Submit Tweak"
                  onClick={() => navigate(`/request-form/tweak/${moduleId}?questionId=${question.id}`)}
                />
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No tweak requests yet for this LYNQ.</div>
            )}
          </div>
        </Card>

        {/* Request Modal */}
        <RequestLynqModal 
          open={requestModalOpen}
          onOpenChange={setRequestModalOpen}
        />
        </div>
      </TooltipProvider>
    </div>
  );
}


/* ---------- UI bits ---------- */
function Card({ title, children, footer, className = "" }: any) {
  return (
    <section className={`rounded-3xl border border-border bg-card p-4 ${className}`}>
      {title && (
        <header className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">{title}</h3>
          {footer}
        </header>
      )}
      {children}
    </section>
  );
}

function KPIGrid({ kpis }: { kpis: typeof defaultKpis }) {
  return (
    <section className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Completion Rate" value={`${kpis.completion}%`} />
        <KPICard label="Engagement Level" value={`${kpis.engagement}%`} />
        <KPICard label="Opening Rate" value={`${kpis.opening}%`} />
        <KPICard label="Average Rating" value={`${kpis.rating}`} />
      </div>
      <div className="mt-3 rounded-3xl p-6 text-primary-foreground text-center bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
        <div className="text-6xl font-extrabold leading-none">{kpis.learners}</div>
        <div className="mt-2 text-base font-semibold opacity-90">Learners Completed</div>
      </div>
    </section>
  );
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl p-4 bg-muted border border-border shadow-sm">
      <div className="text-4xl font-extrabold text-primary text-center">{value}</div>
      <div className="mt-2 text-[11px] font-semibold tracking-wide text-muted-foreground text-center">
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function ActionRow({ title, subtitle, cta, onClick }: any) {
  return (
    <div className="rounded-2xl border border-accent bg-accent/10 p-4">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground mb-3">{subtitle}</div>
      <Button onClick={onClick} className="w-full" size="sm" variant="destructive">
        {cta}
      </Button>
    </div>
  );
}

function TweakCard({ title, subtitle, cta, onClick }: any) {
  return (
    <div className="rounded-2xl border border-yellow-300/50 bg-yellow-100/40 p-4">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs text-muted-foreground mb-3">{subtitle}</div>
      <Button onClick={onClick} className="mt-3 w-full" size="sm">
        {cta}
      </Button>
    </div>
  );
}

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`flex flex-col items-center py-1 ${active ? "text-foreground" : "text-muted-foreground"}`}
      aria-current={active ? "page" : undefined}
    >
      <div className={`size-8 grid place-items-center rounded-xl border ${active ? "border-border" : "border-transparent"}`}>⬤</div>
      <span className="text-[11px] mt-1 font-medium">{label}</span>
    </button>
  );
}
