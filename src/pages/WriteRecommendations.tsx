import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Trash2 } from 'lucide-react';

const WriteRecommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    moduleId: '',
    content: ''
  });

  useEffect(() => {
    fetchModules();
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          modules (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group recommendations by module and content to avoid duplicates in display
      const uniqueRecommendations = [];
      const seen = new Set();
      
      data?.forEach(rec => {
        const key = `${rec.module_id}-${rec.content}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRecommendations.push(rec);
        }
      });
      
      setRecommendations(uniqueRecommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('title');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch modules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.moduleId || !formData.content) {
      toast({
        title: "Error",
        description: "Please select a module and write a recommendation",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // First, get all users who have this module assigned
      const { data: assignments, error: assignmentError } = await supabase
        .from('user_module_assignments')
        .select('user_id')
        .eq('module_id', formData.moduleId);

      if (assignmentError) throw assignmentError;

      // Create recommendations for each user who has this module
      const recommendationsToInsert = assignments.map(assignment => ({
        user_id: assignment.user_id,
        module_id: formData.moduleId,
        content: formData.content
      }));

      if (recommendationsToInsert.length > 0) {
        const { error } = await supabase
          .from('recommendations')
          .insert(recommendationsToInsert);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Recommendation saved for ${recommendationsToInsert.length} user(s)`
        });
      } else {
        toast({
          title: "Info",
          description: "No users assigned to this module yet. Recommendation saved for future assignments."
        });
        
        // Still save one record for future user assignments
        const { error } = await supabase
          .from('recommendations')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // Template for future users
            module_id: formData.moduleId,
            content: formData.content
          });

        if (error) throw error;
      }

      setFormData({ moduleId: '', content: '' });
      // Refresh the recommendations list
      fetchRecommendations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recommendation",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (moduleId: string, content: string) => {
    try {
      // Delete all recommendations with the same module_id and content
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('module_id', moduleId)
        .eq('content', content);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recommendation deleted successfully."
      });

      // Refresh the recommendations list
      fetchRecommendations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recommendation",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center">Loading modules...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Write Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="module">Module</Label>
                <Select 
                  value={formData.moduleId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, moduleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Recommendation</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your recommendation for this module..."
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Recommendation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Recommendations Section */}
        {recommendations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">📋 Your Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Previously written recommendations that appear to users
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((recommendation) => (
                <div 
                  key={recommendation.id} 
                  className="p-4 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">📚</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-foreground">
                          {recommendation.modules?.title || 'Unknown Module'}
                        </h4>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {new Date(recommendation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {recommendation.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recommendation.module_id, recommendation.content)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WriteRecommendations;