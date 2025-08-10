import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Zap } from 'lucide-react';

const AdaptLynqs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [adaptationData, setAdaptationData] = useState({
    title: '',
    description: '',
    adaptedContent: '',
    adaptationType: 'personalized' as 'personalized' | 'contextual' | 'follow-up'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch modules",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedModule || !adaptationData.title || !adaptationData.adaptedContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('module_adaptations')
        .insert({
          original_module_id: selectedModule,
          title: adaptationData.title,
          description: adaptationData.description,
          adapted_content: adaptationData.adaptedContent,
          adaptation_type: adaptationData.adaptationType,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Adaptation Lynq created successfully"
      });

      // Reset form
      setAdaptationData({
        title: '',
        description: '',
        adaptedContent: '',
        adaptationType: 'personalized'
      });
      setSelectedModule('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create adaptation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
              <Zap className="mr-2 h-5 w-5" />
              Create Adaptation Lynq
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="module">Base Module *</Label>
                <select
                  id="module"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select a module to adapt</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Adaptation Title *</Label>
                <Input
                  id="title"
                  value={adaptationData.title}
                  onChange={(e) => setAdaptationData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Personalized for Sales Team"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={adaptationData.description}
                  onChange={(e) => setAdaptationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the adaptation focus and target audience"
                />
              </div>

              <div>
                <Label htmlFor="adaptationType">Adaptation Type</Label>
                <select
                  id="adaptationType"
                  value={adaptationData.adaptationType}
                  onChange={(e) => setAdaptationData(prev => ({ ...prev, adaptationType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="personalized">Personalized</option>
                  <option value="contextual">Contextual</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>

              <div>
                <Label htmlFor="adaptedContent">Adapted Content *</Label>
                <Textarea
                  id="adaptedContent"
                  value={adaptationData.adaptedContent}
                  onChange={(e) => setAdaptationData(prev => ({ ...prev, adaptedContent: e.target.value }))}
                  placeholder="Enter the adapted learning content, questions, or materials"
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Adaptation Lynq'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdaptLynqs;