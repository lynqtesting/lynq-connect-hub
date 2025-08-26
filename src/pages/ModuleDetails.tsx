
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LynqSleekView from "@/components/LynqSleekView";

const ModuleDetails = () => {
  
  const { moduleId } = useParams();
  const { toast } = useToast();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [adaptModalOpen, setAdaptModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'audio'>('analysis');

  useEffect(() => {
    console.log('ModuleDetails: Component mounted with moduleId:', moduleId);
    console.log('ModuleDetails: moduleId type:', typeof moduleId);
    
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
      
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) {
        console.error('ModuleDetails: Supabase error:', error);
        throw error;
      }
      
      console.log('ModuleDetails: Module data fetched successfully:', data);
      setModuleData(data);
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

  return (
    <div className="min-h-screen bg-background">
      <LynqSleekView
        moduleTitle={moduleData?.title || 'Lynq'}
        moduleLink={moduleData?.file_url || moduleData?.module_link}
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
