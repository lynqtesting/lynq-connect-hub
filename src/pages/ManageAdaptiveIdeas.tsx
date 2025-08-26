import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Lightbulb } from 'lucide-react';

// Using a new table structure for adaptive ideas
interface AdaptiveIdea {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const ManageAdaptiveIdeas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<AdaptiveIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      // For now, we'll create ideas in a custom JSON field or use requests table
      // This is a temporary solution until we can add a proper adaptive_ideas table
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('request_type', 'adaptive_idea_template')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data?.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description || '',
        is_active: d.status === 'active',
        created_at: d.created_at
      })) || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({
        title: "Error",
        description: "Failed to fetch adaptive ideas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          title: newIdea.title.trim(),
          description: newIdea.description.trim(),
          request_type: 'adaptive_idea_template',
          status: 'active',
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Adaptive idea added successfully"
      });

      setNewIdea({ title: '', description: '' });
      fetchIdeas();
    } catch (error) {
      console.error('Error adding idea:', error);
      toast({
        title: "Error",
        description: "Failed to add adaptive idea",
        variant: "destructive"
      });
    }
  };

  const toggleIdeaStatus = async (ideaId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: !isActive ? 'active' : 'inactive' })
        .eq('id', ideaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Idea ${!isActive ? 'activated' : 'deactivated'} successfully`
      });

      fetchIdeas();
    } catch (error) {
      console.error('Error updating idea:', error);
      toast({
        title: "Error",
        description: "Failed to update idea",
        variant: "destructive"
      });
    }
  };

  const deleteIdea = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this adaptive idea?')) return;

    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', ideaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Adaptive idea deleted successfully"
      });

      fetchIdeas();
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast({
        title: "Error",
        description: "Failed to delete adaptive idea",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading adaptive ideas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>

        {/* Add New Idea */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add New Adaptive Idea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addIdea} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Idea Title</Label>
                <Input
                  id="title"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  placeholder="Enter adaptive idea title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  placeholder="Detailed description of what this adaptive LYNQ would cover..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Adaptive Idea
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ideas List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Manage Adaptive Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ideas.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No adaptive ideas yet. Add some ideas above to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ideas.map((idea) => (
                  <Card key={idea.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{idea.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {idea.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Created: {new Date(idea.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${idea.id}`} className="text-sm">
                                Active
                              </Label>
                              <Switch
                                id={`active-${idea.id}`}
                                checked={idea.is_active}
                                onCheckedChange={() => toggleIdeaStatus(idea.id, idea.is_active)}
                              />
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => deleteIdea(idea.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageAdaptiveIdeas;