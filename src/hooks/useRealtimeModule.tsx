import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  kpis: any;
  confusion_data: any;
  perception: any;
  objections: any;
  adaptive_modules: any;
  summary_text: string | null;
  tweak_content_request: string | null;
  file_url: string | null;
  module_link: string | null;
  english_audio_url: string | null;
  category: string | null;
  file_type: string | null;
  trend: any;
  version: number;
  updated_at: string;
}

export function useRealtimeModule(moduleId: string) {
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const optimisticUpdatesRef = useRef<Map<string, any>>(new Map());
  const channelRef = useRef<any>(null);

  // Debounced patch function to avoid too many updates
  const debouncedPatchRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchModuleData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      setModuleData(data);
    } catch (error) {
      console.error('Error fetching module:', error);
      toast({
        title: "Error",
        description: "Failed to load module data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [moduleId, toast]);

  // Send patch with optimistic updates and conflict resolution
  const sendPatch = useCallback(async (patch: Partial<ModuleData>) => {
    if (!moduleData) return;

    const patchKey = JSON.stringify(patch);
    
    // Clear existing debounced update for this patch
    const existingTimeout = debouncedPatchRef.current.get(patchKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Apply optimistic update immediately
    setModuleData(prev => prev ? { ...prev, ...patch } : null);
    optimisticUpdatesRef.current.set(patchKey, patch);

    // Debounce the actual database update with longer delay for stability
    const timeoutId = setTimeout(async () => {
      try {
        setSyncing(true);
        
        // Simplified update without version checking for better stability
        const { data, error } = await supabase
          .from('modules')
          .update({
            ...patch,
            updated_at: new Date().toISOString()
          })
          .eq('id', moduleId)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          // Only show errors for genuine failures, not conflicts
          if (error.code !== 'PGRST116') {
            toast({
              title: "Sync Error",
              description: "Changes may not have been saved. Please try again.",
              variant: "destructive"
            });
          }
          // Refresh data to get latest state
          await fetchModuleData();
        } else if (data) {
          // Update with the latest data from server
          setModuleData(data);
          // Remove from optimistic updates since it's now confirmed
          optimisticUpdatesRef.current.delete(patchKey);
        }
      } catch (error) {
        console.error('Error updating module:', error);
        // Revert optimistic update on error
        optimisticUpdatesRef.current.delete(patchKey);
        await fetchModuleData(); // Refresh to get latest state
        
        toast({
          title: "Sync Failed",
          description: "Unable to save changes. Please try again.",
          variant: "destructive"
        });
      } finally {
        setSyncing(false);
        debouncedPatchRef.current.delete(patchKey);
      }
    }, 800); // Longer debounce for better stability

    debouncedPatchRef.current.set(patchKey, timeoutId);
  }, [moduleData, moduleId, toast, fetchModuleData]);

  // Set up realtime subscription
  useEffect(() => {
    if (!moduleId) return;

    fetchModuleData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`module-${moduleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'modules',
          filter: `id=eq.${moduleId}`
        },
        (payload) => {
          const newData = payload.new as ModuleData;
          
          // Only update if this change wasn't from our optimistic update
          // and if we're not currently syncing
          const hasOptimisticUpdates = optimisticUpdatesRef.current.size > 0;
          if (!hasOptimisticUpdates && !syncing) {
            setModuleData(newData);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      // Clear any pending debounced updates
      debouncedPatchRef.current.forEach(timeout => clearTimeout(timeout));
      debouncedPatchRef.current.clear();
    };
  }, [moduleId, fetchModuleData]);

  return {
    moduleData,
    loading,
    syncing,
    sendPatch
  };
}