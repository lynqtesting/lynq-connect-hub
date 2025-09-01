import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  screenshot_url: string;
  created_at: string;
}

interface FetchState {
  modules: Module[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
}

export function useModuleFetching() {
  const [state, setState] = useState<FetchState>({
    modules: [],
    loading: true,
    error: null,
    isEmpty: false
  });
  
  const { user, session } = useAuthPersistence();
  const { toast } = useToast();

  const fetchModules = useCallback(async (retryCount = 0): Promise<Module[]> => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Verify authentication before making request
      if (!user || !session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description, file_url, file_type, screenshot_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const modules = data || [];
      
      setState({
        modules,
        loading: false,
        error: null,
        isEmpty: modules.length === 0
      });

      return modules;

    } catch (error: any) {
      console.error('Error fetching modules:', error);
      
      // Handle different error types
      if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        setState(prev => ({ ...prev, loading: false, error: 'Authentication expired' }));
        toast({
          title: "Session Expired",
          description: "Please refresh the page and log in again.",
          variant: "destructive"
        });
        throw error;
      }

      // Retry logic for network/temporary errors
      if (retryCount < maxRetries && 
          (error?.code === 'ECONNABORTED' || error?.message?.includes('network') || error?.code === 'PGRST000')) {
        
        console.log(`Retrying module fetch in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setState(prev => ({ 
          ...prev, 
          loading: true, 
          error: `Retrying... (${retryCount + 1}/${maxRetries})` 
        }));

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchModules(retryCount + 1);
      }

      // Final error state
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Failed to load modules: ${error.message}` 
      }));
      
      throw error;
    }
  }, [user, session, toast]);

  const refetch = useCallback(() => {
    return fetchModules(0);
  }, [fetchModules]);

  // Initial fetch and auth-dependent refetch
  useEffect(() => {
    if (user && session) {
      fetchModules();
    } else if (!user && !session) {
      setState({
        modules: [],
        loading: false,
        error: 'Please log in to view modules',
        isEmpty: true
      });
    }
  }, [user, session, fetchModules]);

  return {
    ...state,
    refetch,
    fetchModules
  };
}