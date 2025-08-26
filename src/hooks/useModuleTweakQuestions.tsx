import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TweakQuestion {
  id: string;
  module_id: string | null;
  title: string;
  is_active: boolean;
  version: number | null;
  created_at: string;
  updated_at: string;
}

export function useModuleTweakQuestions(moduleId: string) {
  const [questions, setQuestions] = useState<TweakQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tweakable_questions')
        .select('id, module_id, title, is_active, version, created_at, updated_at')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching tweak questions:', error);
      toast({
        title: "Error",
        description: "Failed to load tweak questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [moduleId, toast]);

  const createQuestion = useCallback(async (title: string) => {
    try {
      setSyncing(true);
      const { data, error } = await supabase
        .from('tweakable_questions')
        .insert({
          module_id: moduleId,
          title,
          is_active: true
        })
        .select('id, module_id, title, is_active, version, created_at, updated_at')
        .single();

      if (error) throw error;
      setQuestions(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating tweak question:', error);
      toast({
        title: "Error",
        description: "Failed to create tweak question",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [moduleId, toast]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<Pick<TweakQuestion, 'title'>>) => {
    try {
      setSyncing(true);
      const currentQuestion = questions.find(q => q.id === id);
      if (!currentQuestion) throw new Error('Question not found');

      const currentVersion = currentQuestion.version || 1;
      const { data, error } = await supabase
        .from('tweakable_questions')
        .update(updates)
        .eq('id', id)
        .eq('version', currentVersion) // Optimistic concurrency
        .select('id, module_id, title, is_active, version, created_at, updated_at')
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          toast({
            title: "Sync Conflict",
            description: "This question was modified by another user. Refreshing...",
            variant: "destructive"
          });
          await fetchQuestions();
          return;
        }
        throw error;
      }

      setQuestions(prev => prev.map(q => q.id === id ? data : q));
      return data;
    } catch (error) {
      console.error('Error updating tweak question:', error);
      toast({
        title: "Error",
        description: "Failed to update tweak question",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [questions, toast, fetchQuestions]);

  const deleteQuestion = useCallback(async (id: string) => {
    try {
      setSyncing(true);
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('tweakable_questions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Error deleting tweak question:', error);
      toast({
        title: "Error",
        description: "Failed to delete tweak question",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (moduleId) {
      fetchQuestions();
    }
  }, [fetchQuestions, moduleId]);

  return {
    questions,
    loading,
    syncing,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    refreshQuestions: fetchQuestions
  };
}