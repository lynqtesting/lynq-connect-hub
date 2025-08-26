import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdaptiveIdea {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
}

export function useModuleAdaptiveIdeas(moduleId: string) {
  const [ideas, setIdeas] = useState<AdaptiveIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchIdeas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('adaptive_ideas')
        .select('id, module_id, title, description, version, created_at, updated_at')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching adaptive ideas:', error);
      toast({
        title: "Error",
        description: "Failed to load adaptive ideas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [moduleId, toast]);

  const createIdea = useCallback(async (title: string, description?: string) => {
    try {
      setSyncing(true);
      const { data, error } = await supabase
        .from('adaptive_ideas')
        .insert({
          module_id: moduleId,
          title,
          description: description || null
        })
        .select('id, module_id, title, description, version, created_at, updated_at')
        .single();

      if (error) throw error;
      setIdeas(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating adaptive idea:', error);
      toast({
        title: "Error",
        description: "Failed to create adaptive idea",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [moduleId, toast]);

  const updateIdea = useCallback(async (id: string, updates: Partial<Pick<AdaptiveIdea, 'title' | 'description'>>) => {
    try {
      setSyncing(true);
      const currentIdea = ideas.find(idea => idea.id === id);
      if (!currentIdea) throw new Error('Idea not found');

      const currentVersion = currentIdea.version || 1;
      const { data, error } = await supabase
        .from('adaptive_ideas')
        .update(updates)
        .eq('id', id)
        .eq('version', currentVersion) // Optimistic concurrency
        .select('id, module_id, title, description, version, created_at, updated_at')
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          toast({
            title: "Sync Conflict",
            description: "This idea was modified by another user. Refreshing...",
            variant: "destructive"
          });
          await fetchIdeas();
          return;
        }
        throw error;
      }

      setIdeas(prev => prev.map(idea => idea.id === id ? data : idea));
      return data;
    } catch (error) {
      console.error('Error updating adaptive idea:', error);
      toast({
        title: "Error",
        description: "Failed to update adaptive idea",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [ideas, toast, fetchIdeas]);

  const deleteIdea = useCallback(async (id: string) => {
    try {
      setSyncing(true);
      const { error } = await supabase
        .from('adaptive_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setIdeas(prev => prev.filter(idea => idea.id !== id));
    } catch (error) {
      console.error('Error deleting adaptive idea:', error);
      toast({
        title: "Error",
        description: "Failed to delete adaptive idea",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (moduleId) {
      fetchIdeas();
    }
  }, [fetchIdeas, moduleId]);

  return {
    ideas,
    loading,
    syncing,
    createIdea,
    updateIdea,
    deleteIdea,
    refreshIdeas: fetchIdeas
  };
}