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

interface QueuedOperation {
  id: string;
  patch: Partial<ModuleData>;
  timestamp: number;
  retries: number;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

export function useRealtimeModule(moduleId: string) {
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const { toast } = useToast();

  // Refs for managing operations
  const operationQueueRef = useRef<QueuedOperation[]>([]);
  const channelRef = useRef<any>(null);
  const processingRef = useRef(false);
  const currentUserUpdateRef = useRef<string | null>(null);
  const backoffRef = useRef(1000); // Start with 1 second backoff

  // Fetch module data with error recovery
  const fetchModuleData = useCallback(async (showError = true) => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .maybeSingle();

      if (error) throw error;
      
      setModuleData(data);
      setConnectionStatus('connected');
      backoffRef.current = 1000; // Reset backoff on success
      
      return data;
    } catch (error: any) {
      console.error('Error fetching module:', error);
      
      if (showError) {
        // Only show auth errors, not network errors during reconnection
        if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
          toast({
            title: "Authentication Error",
            description: "Please refresh the page and log in again.",
            variant: "destructive"
          });
        } else if (error?.code !== 'ECONNABORTED') {
          toast({
            title: "Failed to Load Module",
            description: "Unable to load module data. Retrying...",
            variant: "destructive"
          });
        }
      }
      
      setConnectionStatus('offline');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [moduleId, toast]);

  // Process operation queue with exponential backoff and conflict resolution
  const processQueue = useCallback(async () => {
    if (processingRef.current || operationQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setSyncing(true);
    setConnectionStatus('reconnecting');

    while (operationQueueRef.current.length > 0) {
      const operation = operationQueueRef.current[0];
      
      try {
        // Mark this as our update to prevent self-conflicts in realtime
        currentUserUpdateRef.current = operation.id;
        
        const { data, error } = await supabase
          .from('modules')
          .update({
            ...operation.patch,
            updated_at: new Date().toISOString()
          })
          .eq('id', moduleId)
          .select()
          .maybeSingle();

        if (error) {
          throw error;
        }

        // Success - update local state and remove from queue
        setModuleData(data);
        setConnectionStatus('connected');
        backoffRef.current = 1000; // Reset backoff
        
        // Remove successful operation
        operationQueueRef.current.shift();
        operation.resolve(data);

        // Show success for file uploads
        if (operation.patch.english_audio_url) {
          toast({
            title: "Upload Complete",
            description: "Audio file saved successfully.",
            variant: "default"
          });
        }

      } catch (error: any) {
        console.error('Queue processing error:', error);
        
        operation.retries++;
        
        // Handle different error types
        if (error?.code === 'PGRST116') {
          // Conflict - refresh and retry
          try {
            await fetchModuleData(false);
            if (operation.retries < 3) {
              // Retry with fresh data
              continue;
            }
          } catch (refreshError) {
            // If refresh fails, treat as network error
          }
        }
        
        if (operation.retries >= 5) {
          // Max retries reached - remove from queue and notify
          operationQueueRef.current.shift();
          operation.reject(new Error('Max retries exceeded'));
          
          toast({
            title: "Sync Failed",
            description: "Unable to save changes after multiple attempts.",
            variant: "destructive"
          });
        } else {
          // Wait with exponential backoff before retry
          const delay = Math.min(backoffRef.current * Math.pow(2, operation.retries - 1), 30000);
          backoffRef.current = delay;
          
          setConnectionStatus('reconnecting');
          
          if (operation.retries === 1) {
            toast({
              title: "Retrying Save",
              description: `Attempt ${operation.retries + 1} of 5...`,
              variant: "default"
            });
          }
          
          setTimeout(() => processQueue(), delay);
          break; // Exit loop to wait for retry
        }
      } finally {
        currentUserUpdateRef.current = null;
      }
    }

    processingRef.current = false;
    setSyncing(operationQueueRef.current.length > 0);
    
    if (operationQueueRef.current.length === 0) {
      setConnectionStatus('connected');
    }
  }, [moduleId, fetchModuleData, toast]);

  // Send patch with conflict-free queueing
  const sendPatch = useCallback(async (patch: Partial<ModuleData>) => {
    if (!moduleData) return;

    return new Promise<ModuleData>((resolve, reject) => {
      const operation: QueuedOperation = {
        id: `${Date.now()}-${Math.random()}`,
        patch,
        timestamp: Date.now(),
        retries: 0,
        resolve,
        reject
      };

      // Apply optimistic update immediately
      setModuleData(prev => prev ? { ...prev, ...patch } : null);
      
      // Add to queue and process
      operationQueueRef.current.push(operation);
      processQueue();
    });
  }, [moduleData, processQueue]);

  // Set up realtime subscription with improved conflict handling
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
          
          // Ignore updates that we triggered ourselves
          if (currentUserUpdateRef.current) {
            return;
          }
          
          // Only update if we're not currently syncing our own changes
          if (!processingRef.current || operationQueueRef.current.length === 0) {
            console.log('Received external update, applying...', newData.updated_at);
            setModuleData(newData);
            setConnectionStatus('connected');
            
            // Show notification for external updates
            toast({
              title: "Module Updated",
              description: "Changes from another user have been applied.",
              variant: "default"
            });
          } else {
            console.log('Ignoring external update during sync');
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('offline');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      
      // Cancel any pending operations
      operationQueueRef.current.forEach(op => {
        op.reject(new Error('Component unmounted'));
      });
      operationQueueRef.current = [];
      processingRef.current = false;
    };
  }, [moduleId, fetchModuleData, toast]);

  // Auto-retry connection on network recovery
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network recovered, retrying operations...');
      setConnectionStatus('reconnecting');
      processQueue();
    };

    const handleOffline = () => {
      console.log('Network offline detected');
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  return {
    moduleData,
    loading,
    syncing,
    connectionStatus,
    sendPatch,
    queueSize: operationQueueRef.current.length,
    refetch: () => fetchModuleData()
  };
}