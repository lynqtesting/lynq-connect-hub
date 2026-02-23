
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LynqSleekView from "@/components/LynqSleekView";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

const ModuleDetails = () => {

  const { moduleId } = useParams();
  const { toast } = useToast();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [adaptModalOpen, setAdaptModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'audio'>('analysis');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('ModuleDetails: Component mounted with moduleId:', moduleId);

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });

    if (moduleId) {
      fetchModuleData();
    } else {
      console.error('ModuleDetails: No moduleId provided');
      setLoading(false);
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      console.log('ModuleDetails: Fetching data for module:', moduleId);

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .maybeSingle();

      if (error) {
        console.error('ModuleDetails: Supabase error:', error);
        throw error;
      }

      console.log('ModuleDetails: Module data fetched successfully:', data);
      setModuleData(data);

      // Check if current user already completed this module
      if (user && moduleId) {
        const { data: assignment } = await supabase
          .from('user_module_assignments')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('module_id', moduleId)
          .maybeSingle();

        if (assignment?.completed_at) {
          setIsCompleted(true);
        }
      }
    } catch (error) {
      console.error('ModuleDetails: Error fetching module:', error);
      toast({
        title: "Error",
        description: "Failed to load module data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!moduleId || !currentUserId || isCompleted) return;
    setCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke(
        'check-module-completion-alert',
        {
          body: { moduleId, userId: currentUserId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (error) throw error;

      setIsCompleted(true);
      toast({
        title: "Module Completed!",
        description: data?.alertSent
          ? "Great job! The dashboard has been updated and a notification was sent."
          : `Completion recorded. ${data?.completionCount ?? 0}/${data?.threshold ?? 40} completions so far.`,
      });
    } catch (err) {
      console.error('Mark complete error:', err);
      toast({
        title: "Error",
        description: "Could not mark module as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading module...
            <div className="text-xs text-muted-foreground mt-2">Module ID: {moduleId}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="text-lg font-semibold mb-2">Module not found</div>
            <div className="text-sm text-muted-foreground">
              Module ID: {moduleId}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Please check if this module exists and you have access to it.
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('ModuleDetails: Rendering module data:', moduleData);

  const moduleLink = moduleData?.module_link || moduleData?.file_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Module Link + Completion bar */}
      {(moduleLink || !isCompleted) && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2 flex items-center gap-3 max-w-full overflow-x-auto">
          {moduleLink && (
            <a
              href={moduleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <Button size="sm" variant="default" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Module
              </Button>
            </a>
          )}
          <div className="flex-1" />
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium flex-shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0 border-green-500 text-green-700 hover:bg-green-50"
              onClick={handleMarkComplete}
              disabled={completing}
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              {completing ? 'Saving...' : 'Mark as Complete'}
            </Button>
          )}
        </div>
      )}

      <LynqSleekView
        moduleTitle={moduleData?.title || 'Lynq'}
        moduleLink={moduleLink}
        kpis={moduleData?.kpis || undefined}
        trend={moduleData?.trend || undefined}
        confusionData={(moduleData?.confusion_data || [])?.map((i: any) => ({ name: i.name || i.label, value: i.value ?? i.percent }))}
        perception={(moduleData?.perception || [])?.map((i: any) => ({ metric: i.metric || i.label, value: i.value ?? i.percent, target: i.target ?? 80 }))}
        objections={(moduleData?.objections || [])?.map((i: any) => ({ name: i.name || i.label, pct: i.pct ?? i.percent ?? i.value }))}
        summaryText={moduleData?.summary_text || undefined}
        audioUrl={moduleData?.english_audio_url || undefined}
        adaptiveModules={moduleData?.adaptive_modules || []}
        tweakContentRequest={moduleData?.tweak_content_request || undefined}
      />
    </div>
  );
};

export default ModuleDetails;
