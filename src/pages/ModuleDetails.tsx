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
    fetchModuleData();
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      
      console.log('Module data fetched:', data); // Debug log
      setModuleData(data);
    } catch (error) {
      console.error('Error fetching module:', error); // Debug log
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
          <div className="text-center py-8">Loading module...</div>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <div className="text-center py-8">Module not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LynqSleekView
        moduleTitle={moduleData?.title || 'Lynq'}
        moduleLink={moduleData?.module_link}
        kpis={moduleData?.kpis || undefined}
        trend={moduleData?.trend || undefined}
        confusionData={(moduleData?.confusion_data || [])?.map((i: any) => ({ name: i.name || i.label, value: i.value ?? i.percent }))}
        perception={(moduleData?.perception || [])?.map((i: any) => ({ metric: i.metric || i.label, value: i.value ?? i.percent, target: i.target ?? 80 }))}
        objections={(moduleData?.objections || [])?.map((i: any) => ({ name: i.name || i.label, pct: i.pct ?? i.percent ?? i.value }))}
        summaryText={moduleData?.summary_text || undefined}
        audioUrl={moduleData?.english_audio_url || undefined}
      />
    </div>
  );
};

export default ModuleDetails;