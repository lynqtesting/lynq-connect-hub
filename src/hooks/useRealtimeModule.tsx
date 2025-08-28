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

    // Debounce the actual database update with shorter delay for better UX
    const timeoutId = setTimeout(async () => {
      try {
        setSyncing(true);
        
        // Use UPDATE to ensure we're modifying the existing record, not creating a new one
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
          
          // Show user-friendly error messages
          if (error.code === 'PGRST116') {
            toast({
              title: "Sync Conflict",
              description: "Module was updated elsewhere. Refreshing...",
              variant: "default"
            });
          } else {
            toast({
              title: "Sync Error", 
              description: "Failed to save changes. Retrying...",
              variant: "destructive"
            });
          }
          
          // Always refresh to get latest state on error
          await fetchModuleData();
        } else if (data) {
          // Successfully updated - use server response as source of truth
          setModuleData(data);
          optimisticUpdatesRef.current.delete(patchKey);
          
          // Show success feedback for file uploads
          if (patch.english_audio_url && !moduleData.english_audio_url) {
            toast({
              title: "Upload Complete",
              description: "Audio file has been saved successfully.",
              variant: "default"
            });
          }
        }
      } catch (error) {
        console.error('Error updating module:', error);
        
        // Revert optimistic update and refresh
        optimisticUpdatesRef.current.delete(patchKey);
        await fetchModuleData();
        
        toast({
          title: "Connection Error",
          description: "Unable to connect. Please check your internet connection.",
          variant: "destructive"
        });
      } finally {
        setSyncing(false);
        debouncedPatchRef.current.delete(patchKey);
      }
    }, 500); // Shorter debounce for better responsiveness

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