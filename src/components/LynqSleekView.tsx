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
import TweakRequestModal from "@/components/TweakRequestModal";
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
  const [tweakModalOpen, setTweakModalOpen] = useState(false);
  const [selectedTweakQuestion, setSelectedTweakQuestion] = useState<any>(null);
  const [tweakingQuestions, setTweakingQuestions] = useState<any[]>([]);
  const [adaptiveIdeas, setAdaptiveIdeas] = useState<any[]>([]);
  const { moduleId } = useParams();

  useEffect(() => {
    document.title = `${moduleTitle} – Lynq Dashboard`;
  }, [moduleTitle]);

  useEffect(() => {
    fetchTweakingQuestions();
    fetchAdaptiveIdeas();
  }, []);

  const fetchAdaptiveIdeas = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get assigned module IDs
      const { data: assignments } = await supabase
        .from('user_module_assignments')
        .select('module_id')
        .eq('user_id', user.id);

      const assignedModuleIds = assignments?.map(a => a.module_id).filter(Boolean) || [];
      
      if (assignedModuleIds.length === 0) {
        setAdaptiveIdeas([]);
        return;
      }

      // Fetch adaptive ideas only from assigned modules
      const { data, error } = await supabase
        .from('adaptive_ideas')
        .select('*')
        .in('module_id', assignedModuleIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdaptiveIdeas(data || []);
    } catch (error) {
      console.error('Error fetching adaptive ideas:', error);
    }
  };

  const fetchTweakingQuestions = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get assigned module IDs
      const { data: assignments } = await supabase
        .from('user_module_assignments')
        .select('module_id')
        .eq('user_id', user.id);

      const assignedModuleIds = assignments?.map(a => a.module_id).filter(Boolean) || [];
      
      if (assignedModuleIds.length === 0) {
        setTweakingQuestions([]);
        return;
      }

      // Fetch tweakable questions only from assigned modules
      const { data, error } = await supabase
        .from('tweakable_questions') 
        .select('*')
        .eq('is_active', true)
        .in('module_id', assignedModuleIds)
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
            <div className="h-80 w-full bg-background rounded-lg overflow-hidden">
              {tab === "trend" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cPrimary} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={cPrimary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} 
                    />
                    <YAxis hide domain={[60, 100]} />
                    <ReTooltip cursor={{ fill: "#00000008" }} formatter={(v: any) => [`${v}%`]} />
                    <Area dataKey="completion" stroke={cPrimary} strokeWidth={2} fill="url(#g1)" type="monotone" />
                    <Area dataKey="engagement" stroke={cAccent} strokeWidth={2} fillOpacity={0} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {tab === "confusion" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confusionData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120} 
                      tick={{ fontSize: 9, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      className="break-words"
                    />
                    <ReTooltip cursor={{ fill: "#00000008" }} formatter={(v: any) => [`${v}%`, "Confusion"]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={cPrimary}>
                      {confusionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={cPrimary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {tab === "perception" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perception} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="metric" 
                      width={120} 
                      tick={{ fontSize: 9, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      className="break-words"
                    />
                    <ReTooltip
                      cursor={{ fill: "#00000008" }}
                      formatter={(v: any) => [`${v}%`, "Value"]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={cAccent}>
                      {perception.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={cAccent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {tab === "objections" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={objections} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120} 
                      tick={{ fontSize: 9, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      className="break-words"
                    />
                    <ReTooltip cursor={{ fill: "#00000008" }} formatter={(v: any) => [`${v}%`]} />
                    <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill={cDestructive}>
                      {objections.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={cDestructive} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Actions & Improvements */}
        <Card title="Actions & Improvements" className="mt-3">
          <div className="text-[13px] font-semibold text-foreground mb-2 flex items-center gap-2">
            Next Adaptive Lynqs
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  📈 Create new bite-sized modules that sharpen learning and uncover fresh insights 🔍 on your product.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <AdaptiveIdeasSection 
            adaptiveIdeas={adaptiveIdeas}
            requestModalOpen={requestModalOpen} 
            setRequestModalOpen={setRequestModalOpen} 
          />
        </Card>

        {/* Tweak the LYNQ */}
        <Card className="mt-3">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[13px] font-semibold">Tweak the LYNQ</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">
                  🛠️ Refine existing modules up to three times—improving clarity ✅ while gathering deeper insights 💡 on your team's understanding.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-3">
            {tweakingQuestions.length > 0 ? (
              tweakingQuestions.map((question) => (
                <TweakCard
                  key={question.id}
                  title={question.title}
                  subtitle="Share materials or notes to refine this LYNQ"
                  cta="Submit Tweak"
                  onClick={() => {
                    setSelectedTweakQuestion(question);
                    setTweakModalOpen(true);
                  }}
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
        
        {/* Tweak Modal */}
        {selectedTweakQuestion && (
          <TweakRequestModal
            open={tweakModalOpen}
            onOpenChange={setTweakModalOpen}
            questionId={selectedTweakQuestion.id}
            questionTitle={selectedTweakQuestion.title}
          />
        )}
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

function AdaptiveIdeasSection({ 
  adaptiveIdeas,
  requestModalOpen, 
  setRequestModalOpen 
}: { 
  adaptiveIdeas: any[];
  requestModalOpen: boolean; 
  setRequestModalOpen: (open: boolean) => void 
}) {
  const { toast } = useToast();

  const handleRequestAdaptive = (idea: any) => {
    // Store the selected idea in localStorage for the modal
    localStorage.setItem('selectedAdaptiveIdea', JSON.stringify(idea));
    setRequestModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {adaptiveIdeas.length > 0 ? (
        adaptiveIdeas.map((idea) => (
          <ActionRow
            key={idea.id}
            title={idea.title}
            subtitle={idea.description || "No description provided"}
            cta="Request Custom LYNQ"
            onClick={() => handleRequestAdaptive(idea)}
          />
        ))
      ) : (
        <ActionRow
          title="No adaptive ideas available"
          subtitle="Contact admin to add adaptive LYNQ ideas."
          cta="Request Custom LYNQ"
          onClick={() => setRequestModalOpen(true)}
        />
      )}
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
